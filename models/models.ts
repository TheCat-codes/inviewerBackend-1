import mysql2, { type Connection, type ResultSetHeader, type ConnectionOptions } from 'mysql2/promise'
import { ConnectionError, EmptyData, InvalidTypes, RepeatedUser, UserNotFound } from '../errorClasses.js'
import type { Job, Skill, Skills, Solicitude, User } from '../types.js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config() 

const dburl = process.env.DB_URL

function returnError (e:Error) {
  if(e instanceof ConnectionError) {
    throw new ConnectionError('Connection Error')
  } else {
    throw e
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD
  }
})

interface VerifyCode {
  code: string,
  email:string,
  expires_in: Date
}

const salt = 10

export class Models {
  private static _connection: Connection | undefined;

  public static async initializeConnection(): Promise<void> {
    const MAX_RETRIES = 35;
    const RETRY_DELAY_MS = 2000; // 2 segundos de retraso entre reintentos

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        console.log(`Intentando conectar a MySQL... (Intento ${i + 1}/${MAX_RETRIES})`);
        if(!dburl) return
        Models._connection = await mysql2.createPool(dburl); // Usamos dbConfig aquí
        console.log('✅ Conexión a MySQL establecida con éxito.');
        return; // Sale de la función si la conexión es exitosa
      } catch (error: any) {
        console.error(`❌ Error al establecer la conexión (Intento ${i + 1}/${MAX_RETRIES}):`, error.message);
        if (i < MAX_RETRIES - 1) {
          console.log(`Reintentando en ${RETRY_DELAY_MS / 1000} segundos...`);
          await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
        } else {
          const errorMessage = `🔴 Falló la conexión a MySQL después de ${MAX_RETRIES} intentos.`;
          console.error(errorMessage);
          throw new ConnectionError(errorMessage); // Lanzamos un error si todos los intentos fallan
        }
      }
    }
  }

  // Método auxiliar para obtener la conexión, asegurando que esté disponible
  private static getConnection(): Connection {
    if (!Models._connection) {
      throw new ConnectionError('Database connection not established. Call initializeConnection() first.');
    }
    return Models._connection;
  }

  static sendCode = async (email:string) => {
    if(!email) throw new InvalidTypes('Insert an email')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [ exists ] = await connection.query(`select * from users where email = ?;`, [email])
      const user = exists as User[]

      if(user.length === 0) throw new EmptyData('User not found')

      await connection.query(`DELETE FROM reset_passwords WHERE email = ?`, [email])
      
      const code = crypto.randomInt(100000, 999999).toString()
      const expiresIn = new Date(Date.now() + 10 * 60 * 1000)

      await connection.query(`
        insert into reset_passwords (email, code, expires_in)
        values (?, ?, ?)  
      `, [ email, code, expiresIn ])

      await transporter.sendMail({
        from: `"InViewer" <${process.env.NODEMAILER_USER}>`,
        to: email,
        subject: 'Reset password code',
        text: 'Your reset password code is ' + code
      })

      return { message: 'your code has been sent to ' + email}
    } catch (e:any) {
      returnError(e)
    }
  }

  static verifyCode = async (code:string, email:string) => {
    if(!email || !code) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [verification] = await connection.query(`
        select email, expires_in, code from reset_passwords where email = ? and code = ?
        order by id desc limit 1
      `, [email, code])

      if((verification as any).length === 0) throw new EmptyData('Invalid Code')
      
      const object = (verification as any)[0]
      if(new Date() > object.expires_in) throw new InvalidTypes('Code Expired')

      return { message: 'Code verified' }
    } catch (e:any) {
      returnError(e)
    }
  }

  static resetPassword = async (email:string, code:string, newPassword:string) => {
    if(!email || !code || !newPassword) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [verification] = await connection.query(`
        select email, expires_in, code from reset_passwords where email = ? and code = ?
        order by id desc limit 1
      `, [email, code])

      const records = verification as VerifyCode[]
      if(records.length === 0) throw new EmptyData('Invalid Code')

      const record = records[0]!
      if(new Date() > record?.expires_in) throw new InvalidTypes('Code has expired')

      
      const hashedPassword = await bcrypt.hash(newPassword, salt)

      const [createPassword] = await connection.query<ResultSetHeader>(`
        update users set password = ? where email = ?
      `, [hashedPassword, email])

      if(createPassword.affectedRows === 0) throw new ConnectionError('Try later')
      
      await connection.query(`delete from reset_passwords where email = ?`, [email])

      return { message: 'Password updated' }
    } catch (e:any) {
      returnError(e)
    }
  }

  static login = async (username:string, password:string) => {
    if(!username || !password) throw new InvalidTypes('Data is empty')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [logged] =  await connection.query(`
        select bin_to_uuid(user_id) as user_id, name, username, email, password, birthdate from users where username = ?;        
      `, [username])

      const finded = logged as User[]
      
      if(finded.length === 0) throw new UserNotFound('User not found')

      const user = finded[0]
      if(!user?.password) throw new ConnectionError('Password is missing')
      const comparePassword = await bcrypt.compare(password, user?.password)

      if(!comparePassword) throw new UserNotFound('Incorrect Password')
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (e) {
      if(e instanceof InvalidTypes || e instanceof UserNotFound) {
        throw e
      }
      throw new ConnectionError('Connection error')
    }
  }

  static sendEmailCode = async (email:string) => {
    if(!email) throw new InvalidTypes('Invalid Data')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [sameEmail] = await connection.query(`
        select * from users where email = ?
      `, [ email ])

      const repeatedEmail = sameEmail as User[]
      if(repeatedEmail.length > 0) throw new RepeatedUser('Email already exists')

      const code = crypto.randomInt(100000, 999999).toString();
      const expires = new Date(Date.now()+ 1000 * 60 * 10)

      await connection.query(`DELETE FROM check_email WHERE email = ?`, [email])
      const [insertCode] = await connection.query<ResultSetHeader>(`
        insert into check_email  (email, code, expires_in) 
        values (?, ?, ?)
      `, [email, code, expires])

      if(insertCode.affectedRows === 0) throw new ConnectionError('Connection error')
        
      await transporter.sendMail({
        from: `"InViewer" <${process.env.NODEMAILER_USER}>`,
        to: email,
        subject: 'Verification Code',
        text: `your verification code is ${code}`,
      })

      return { message: 'your verification code has been sent to your mail Account' }
    } catch (e:any) {
      returnError(e)
    } 
  }

  static verifyEmailCode = async (email:string, code:string) => {
    if(!email || !code) throw new InvalidTypes('Invalid Data')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [verifyCode] = await connection.query(`select * from check_email where email = ? and code = ? order by id desc limit 1`, [email, code])

      if((verifyCode as any).length === 0) throw new EmptyData('Invalid Code')
      const record = (verifyCode as any)[0]
      if(new Date() > record.expires_in) throw new InvalidTypes('Code expired')

      return { message: 'Code verified'}
    } catch (e:any) {
      returnError(e)
    }
  }

  static register = async ({name, username, password, email, birthdate, code}:{name:string, username:string, password:string, email:string, birthdate:Date, code:string}) => {
    if(!name || !email || !username || !password || !birthdate || !code) {
      throw new InvalidTypes('Enter al the data')
    }
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [sameUsername] = await connection.query(`
        select * from users where username = ?
      `, [ username ])

      const repeatedUser = sameUsername as User[]
      if(repeatedUser.length > 0) throw new RepeatedUser('Username already exists')

      const [verification] = await connection.query(`
        select email, expires_in, code from check_email where email = ? and code = ?
        order by id desc limit 1
      `, [email, code])

      if((verification as any).length === 0) throw new EmptyData('User not found')
      const record = (verification as any)[0]
      if(new Date() > record.expires_in) throw new InvalidTypes('Code has expired')

      const salts = 10
      const hashedPassword = await bcrypt.hash(password, salts)
      console.log(hashedPassword)

      const [register] = await connection.query<ResultSetHeader>(`
        insert into users (name, username, password, email, birthdate)
        values(?, ?, ?, ?, ?);
      `, [ name, username, hashedPassword, email, birthdate ])
      
      if(register.affectedRows === 0) throw new ConnectionError('Connection Error')
      
      await connection.query(`delete from check_email where email = ?`, [email])

      return { message: 'user registered'}
    } catch (e) {
      if(e instanceof InvalidTypes || e instanceof UserNotFound || e instanceof RepeatedUser) {
        throw e
      }
      console.log(e)
      throw new ConnectionError('Connection error')
    }
  }

  static getWorks = async () => {
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [ works ] = await connection.query(`
        select bin_to_uuid(w.work_id) as work_id, w.description, w.salary, u.username, u.name, title from jobs w
        join users u on u.user_id = w.boss;
      `)

      const worksArray = works as Job[]
      if(worksArray.length === 0) throw new EmptyData('No jobs founds')

      return worksArray;
    } catch (e:any) {
      returnError(e)
    }
  }

  static getWorksByUser = async ({ id }: {id:string}) => {
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [ works ] = await connection.query(`
        select bin_to_uuid(w.work_id) as work_id, w.description, w.salary, u.username, u.name, title from jobs w
        join users u on u.user_id = w.boss
        where w.boss = uuid_to_bin(?);
      `, [id])

      const worksArray = works as Job[]
      if(worksArray.length === 0) throw new EmptyData('No jobs founds')

      return worksArray;
    } catch (e:any) {
      returnError(e)
    }
  }

    static getUser = async (id:string) => {
      const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [ search ] = await connection.query('select bin_to_uuid(user_id) as user_id, username, password, name, email, birthdate from users where uuid_to_bin(?) = user_id', [id])

      const user = search as User[]

      if(user.length === 0) throw new UserNotFound('User not found')
      return user[0]
    } catch (e:any) {
      returnError(e)
    }
  }

  static publishWork = async ({description, salary, boss, title }:{description:string, salary: number, boss: string, title:string }) =>  {
    if(!description || !boss || !salary || !title) throw new InvalidTypes('Complete the Job Description')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [insertJob] = await connection.query<ResultSetHeader>(`
        insert into jobs (description, salary, boss, title)
        values (?, ?, uuid_to_bin(?), ?);
      `, [ description, salary, boss, title ])

      if(insertJob.affectedRows === 0) throw new ConnectionError('Conection Error')
      return { message: 'Job in the VIEW'}
    } catch (e:any) {
      returnError(e)
    }
  }

  static sendSolicitude = async ({ work_id, cv_url, user_id }:{work_id:  string, cv_url: string, user_id: string }) => {
    if(!work_id || !user_id || !cv_url) throw new InvalidTypes('Try later!')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [postSolicitude] = await connection.query<ResultSetHeader>(`
        insert into solicitudes (work_id, user_id, resume_url)
        values (uuid_to_bin(?), uuid_to_bin(?), ?)
      `, [work_id, user_id, cv_url])

      if(postSolicitude.affectedRows === 0) throw new ConnectionError('Connection Error')
      return { message: 'Solicitude sent'}
    } catch (e:any) {
      returnError(e)
    }
  }

  static getSolicitudesByWork = async ({ id }:{ id:string }) => {
    if(!id) throw new InvalidTypes('Invalid data')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [solicitudes] = await connection.query(`
        select u.username, s.resume_url, u.name, created_at, bin_to_uuid(s.solicitude_id) as solicitude_id, bin_to_uuid(s.user_id) as user_id, bin_to_uuid(s.work_id) as work_id from solicitudes s
        join users u on u.user_id = s.user_id
        where s.work_id = uuid_to_bin(?);
      `, [id])
      
      const solicitudesGetted = solicitudes as Solicitude[]

      if(solicitudesGetted.length === 0) throw new EmptyData('No solicitudes for this Job')
      return solicitudesGetted
    } catch (e:any) {
      returnError(e)
    }
  }

  static addSkills = async ({ user_id, skill_id }:{ user_id:string, skill_id:number }) => {
    if(!user_id || !skill_id) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [existedSkill] = await connection.query(`
        select * from user_skills where user_id = uuid_to_bin(?) and skill_id = ?;
      `, [user_id, skill_id])

      const exists = existedSkill as Skill[]
      if(exists.length > 0) throw new Error('The skill aready exists')

      const [addSkill] = await connection.query<ResultSetHeader>(`
        insert into user_skills (user_id, skill_id)
        values (uuid_to_bin(?), ?);
      `, [user_id, skill_id])

      if(addSkill.affectedRows === 0) throw new ConnectionError('Try later')
      return { message: 'Skill added' }
    } catch (e:any) {
      returnError(e)
    }
  }

  static removeSkill = async ({ user_id, skill }:{ user_id:string, skill:string }) => {
    if(!user_id || !skill) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [remSkill] = await connection.query<ResultSetHeader>(`
        delete from user_skills
        where user_id = uuid_to_bin(?) and skill_id = ?;
      `, [user_id, skill])

      if(remSkill.affectedRows === 0) throw new ConnectionError('Try later')
      return { message: 'Skill removed' }
    } catch (e:any) {
      returnError(e)
    }
  }

  static searchSkills = async (search:string) => {
    if(!search) throw new InvalidTypes('Empty search not allowed')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [skillsSearch] = await connection.query(`select * from skills where skill like(?)`,[`%${search}%`])

      if((skillsSearch as any).length === 0) throw new EmptyData('No skills found')
      return skillsSearch
    } catch (e:any) {
      returnError(e)
    }
  }

  static getWorksBySearch = async ({ search }: {search: string}) => {
    if(!search) throw new InvalidTypes('empty search is not valid')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [searchWorks] = await connection.query(`
        select bin_to_uuid(w.work_id) as work_id, w.description, w.salary, u.username, u.name, title from jobs w
        join users u on u.user_id = w.boss 
        where title like(?)
      `, [`%${search}%`])

      const works = searchWorks as Job[]

      if(works.length === 0) throw new EmptyData('There arent jobs for this search')
      return works
    } catch (e:any) {
      returnError(e)
    }
  }

  static removeSolicitude = async ({ work_id, user_id }: { work_id:string, user_id:string }) => {
    if(!work_id || !user_id) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [remSolicitud] = await connection.query<ResultSetHeader>(`
        delete from solicitudes where user_id = uuid_to_bin(?) and work_id = uuid_to_bin(?) 
      `, [ user_id, work_id])

      if(remSolicitud.affectedRows === 0) throw new ConnectionError('Try later')
      return { message: 'Solicitude removed'}
    } catch (e:any) {
      returnError(e)
    }
  }

  static getSkillsByUser = async ({ id }: { id: string }) => {
    if(!id) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [ skills ] = await connection.query(`
        select s.skill, s.skill_id  from  user_skills us
        join users u on u.user_id = us.user_id
        join skills s on s.skill_id = us.skill_id
        where us.user_id = uuid_to_bin(?);
      `, [ id ])

      const userSkills = skills as Skill[]

      return userSkills
    } catch (e:any) {
      returnError(e)
    }
  }

  static getSkills = async () => {
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [skills] = await connection.query(`
        select skill from skills;
      `)

      const totalSkills = (skills as Skills[]).map(s => s.skill as string)
      if(totalSkills.length === 0) throw new EmptyData('There arent skills yet')
      return totalSkills
    } catch (e:any) {
      returnError(e)
    }
  }

  static removeJob = async ({ id }: {id:string}) => {
    if(!id) throw new InvalidTypes('No data provided')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [removed] = await connection.query<ResultSetHeader>(`delete from jobs where work_id = uuid_to_bin(?)`, [ id ])
      if(removed.affectedRows === 0) throw new ConnectionError('Connection error')

      return { message: 'Job removed' }
    } catch (e:any) {
      returnError(e)
    }
  }

  static getMySolicitudes = async ({ id }:{ id:string }) => {
    if(!id) throw new InvalidTypes('Invalid data')
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [solicitudes] = await connection.query(`
        SELECT 
          j.title,
          BIN_TO_UUID(s.user_id)   AS user_id,
          BIN_TO_UUID(s.work_id)   AS work_id,
          bin_to_uuid(s.solicitude_id) as solicitude_id,
          u.username               AS boss_username
        FROM solicitudes s
        JOIN jobs j 
          ON j.work_id = s.work_id
        JOIN users u 
          ON u.user_id = j.boss
        where s.user_id = uuid_to_bin(?);
      `, [id])
      
      const solicitudesGetted = solicitudes as any

      if(solicitudesGetted.length === 0) throw new EmptyData('You havent send solicitudes')
      return solicitudesGetted
    } catch (e:any) {
      returnError(e)
    }
  }

  static getSolicitudes = async () => {
    const connection = Models.getConnection(); // Obtener la conexión
    try {
      const [solicitudes] = await connection.query(`
        select bin_to_uuid(user_id) as user_id, bin_to_uuid(work_id) as work_id, solicitude_id from solicitudes;
      `)
      
      const solicitudesGetted = solicitudes as any

      if(solicitudesGetted.length === 0) throw new EmptyData('No solicitudes to show')
      return solicitudesGetted
    } catch (e:any) {
      returnError(e)
    }
  }

  static updateProfile = async (name:string, username:string, user_id:string) => {
    try {
      const connection = Models.getConnection(); // Obtener la conexión
      const [update] = await connection.query<ResultSetHeader>(`
        update users set name = ?, username = ? where user_id = uuid_to_bin(?)  
      `, [name, username, user_id])
      
      if(update.affectedRows === 0) throw new ConnectionError('Connection Error')
      return {message: 'Profile updated'}
    } catch (e:any) {
      returnError(e)
    }
  }
}

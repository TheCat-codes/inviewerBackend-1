export type Login = {
  username: string,
  password: string
}

export type Register = {
  name: string,
  email: string,
  username: string,
  password: string,
  birthdate: string
}


export type User = {
  user_id: Buffer,
  username: string,
  name:string,
  password: string
}

export type Job = {
  work_id: string,
  description: string,
  salary: number,
  username: string,
  name: string
}

export type Solicitude = {
  username:string,
  name:string,
  resume_url:string
}

export type Skills = {
  skill:string
}

export type Skill = {
  user_id: string,
  skill_id: number
}

export type ResetPassword = {
  email: string,
  code: number
}
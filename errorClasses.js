export class InvalidTypes extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTypes';
    }
}
export class RepeatedUser extends Error {
    constructor(message) {
        super(message);
        this.name = 'RepeatedUser';
    }
}
export class UserNotFound extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFound';
    }
}
export class ConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}
export class EmptyData extends Error {
    constructor(message) {
        super(message);
        this.name = 'EmptyData';
    }
}
//# sourceMappingURL=errorClasses.js.map
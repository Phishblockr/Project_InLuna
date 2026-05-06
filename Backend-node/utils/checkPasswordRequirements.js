export function checkPasswordRequirements(password, name, email) {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const containsName = name && password.toLowerCase().includes(name.toLowerCase());
    const containsEmail = email && password.toLowerCase().includes(email.toLowerCase());
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];

    return {
        minLength: password.length >= minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar,
        notContainsName: !containsName,
        notContainsEmail: !containsEmail,
        notCommon: !commonPasswords.includes(password.toLowerCase())
    };
}

export const friendlyMessages = {
    minLength: "Minimum length is 12 characters.",
    hasUppercase: "Must include an uppercase letter.",
    hasLowercase: "Must include a lowercase letter.",
    hasNumber: "Must include a number.",
    hasSpecialChar: "Must include a special character.",
    notContainsName: "Should not contain your name.",
    notContainsEmail: "Should not contain your email.",
    notCommon: "Too common. Choose a stronger password."
};
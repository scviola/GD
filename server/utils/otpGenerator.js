const generateOTP = () => {
    // 6-8 digits
    const length = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)).toString();
};

const isOTPValid = (otp, hashedOTP, expiryTime) => {
    const now = new Date();
    const isMatch = otp === hashedOTP;
    const notExpired = now < expiryTime;
    return isMatch && notExpired;
};

module.exports = { generateOTP, isOTPValid };

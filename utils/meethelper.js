// utils/meetHelper.js
const generateGoogleMeetCode = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    
    for (let i = 0; i < 10; i++) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }
    
    return `${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7)}`;
  };
  
  const generateGoogleMeetLink = () => {
    const code = generateGoogleMeetCode();
    return `https://meet.google.com/${code}`;
  };
  
  module.exports = { generateGoogleMeetLink };
export const assistantCharacters = {
  advisor: {
    name: 'Advisor',
    image: '/assets/advisor.png',
    position: 'left' as const,
    messages: {
      normal: "I'm here to help!",
      curious: "Tell me more about your experience...",
      happy: "Great progress!",
      lookingAway: "I'll give you some privacy",
    }
  },
  recruiter: {
    name: 'Recruiter',
    image: '/assets/recruiter.png',
    position: 'right' as const,
    messages: {
      normal: "Ready to review your resume!",
      curious: "Interesting background...",
      happy: "Your resume looks great!",
      lookingAway: "Taking notes..."
    }
  }
};
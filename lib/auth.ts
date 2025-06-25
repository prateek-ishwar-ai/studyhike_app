export async function signUp(email: string, password: string, fullName: string, role: string) {
  // Mock signup function
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock signup:", email, password, fullName, role)
      resolve({ data: { user: { email } }, error: null })
    }, 500)
  })
}

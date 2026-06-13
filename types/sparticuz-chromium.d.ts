declare module '@sparticuz/chromium' {
  const chromium: {
    args: string[]
    executablePath(input?: string): Promise<string>
    headless: boolean
  }
  export default chromium
}

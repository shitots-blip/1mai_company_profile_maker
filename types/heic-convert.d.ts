declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer
    format: 'JPEG' | 'PNG'
    quality?: number
  }
  const convert: (options: ConvertOptions) => Promise<ArrayBuffer>
  export default convert
}

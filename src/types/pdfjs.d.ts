/**
 * TypeScript declarations for pdfjs-dist
 * Minimal declarations for our specific use case
 */

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<PDFPageProxy>
    getMetadata(): Promise<{
      info?: {
        Title?: string
        Author?: string
        CreationDate?: string
      }
    }>
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<{
      items: Array<{
        str: string
        dir: string
        width: number
        height: number
        transform: number[]
        fontName: string
      }>
    }>
  }

  export interface LoadingTask {
    promise: Promise<PDFDocumentProxy>
  }

  export function getDocument(params: {
    data: Uint8Array
    disableStream?: boolean
    disableAutoFetch?: boolean
    maxImageSize?: number
    cMapPacked?: boolean
  }): LoadingTask

  export const GlobalWorkerOptions: {
    workerSrc: string | null
  }
}
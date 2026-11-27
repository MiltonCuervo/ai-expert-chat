import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'AI Expert Chat',description:'Tu asistente especializado en programación'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}</body></html>; }

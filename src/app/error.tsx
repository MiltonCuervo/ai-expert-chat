'use client';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {return <main className="mx-auto max-w-lg p-10"><h1 className="text-2xl font-bold">No se pudo cargar la página</h1><p className="my-4 text-slate-400">Inténtalo de nuevo en unos momentos.</p><button onClick={reset}>Reintentar</button></main>}

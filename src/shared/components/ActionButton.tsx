import type { ButtonHTMLAttributes, ReactNode } from 'react'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement>{children:ReactNode;variant?:'primary'|'secondary'}
export function ActionButton({children,variant='primary',className='',...props}:Props){const style=variant==='primary'?'bg-green-400 text-slate-950 hover:bg-green-300':'border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-green-400';return <button className={`rounded-xl px-5 py-3 text-sm font-black transition ${style} ${className}`} {...props}>{children}</button>}

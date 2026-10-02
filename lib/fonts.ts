import { Bricolage_Grotesque, Anton } from 'next/font/google'

export const sans = Bricolage_Grotesque({ subsets: ['latin'], variable: '--c-sans' })
export const meme = Anton({ subsets: ['latin'], weight: '400', variable: '--c-meme' })
export const fontVars = `${sans.variable} ${meme.variable}`
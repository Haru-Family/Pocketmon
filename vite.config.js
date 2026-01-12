import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                hangman: resolve(__dirname, 'games/hangman/index.html'),
                cry_quiz: resolve(__dirname, 'games/cry-quiz/index.html'),
                card_flip: resolve(__dirname, 'games/card-flip/index.html'),
            },
        },
    },
})

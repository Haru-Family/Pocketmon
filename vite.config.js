import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/Pocketmon/', // GitHub 저장소 이름과 동일하게 설정
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                hangman: resolve(__dirname, 'games/hangman/index.html'),
                cryQuiz: resolve(__dirname, 'games/cry-quiz/index.html'),
                cardFlip: resolve(__dirname, 'games/card-flip/index.html'),
            },
        },
    },
})

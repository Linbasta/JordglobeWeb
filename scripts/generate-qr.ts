#!/usr/bin/env node
import * as QRCode from 'qrcode'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'qr-download.png')

QRCode.toDataURL('https://jordglobe.com/download', {
    width: 256,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
}, (error, dataUrl) => {
    if (error) {
        console.error('Failed to generate QR code:', error)
        process.exit(1)
    }
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    writeFileSync(outPath, Buffer.from(base64, 'base64'))
    console.log('✓ Generated QR code: public/qr-download.png')
})

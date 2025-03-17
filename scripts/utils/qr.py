import qrcode


def generate_qr(url, filename="qrcode.png"):
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    return filename


url = "https://jordglobe.com/download"
output_file = generate_qr(url, "my_qrcode.png")
print(f"QR code saved as {output_file}")

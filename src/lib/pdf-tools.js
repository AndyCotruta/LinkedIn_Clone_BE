import imageToBase64 from "image-to-base64";
import PdfPrinter from "pdfmake";

export const getPDFReadableStream = async (user) => {
  async function createBase64Img(url) {
    let base64Encoded = await imageToBase64(url);
    return "data:image/jpeg;base64, " + base64Encoded;
  }

  // Define font files
  const fonts = {
    Roboto: {
      normal: "Helvetica",
      bold: "Helvetica",
      italics: "Helvetica",
    },
  };

  const printer = new PdfPrinter(fonts);

  const docDefinition = {
    content: [
      { text: user.name, style: "header", margin: [0, 15, 0, 0] },
      { text: user.surname, style: "subheader", margin: [0, 2] },
      { text: user.title, style: "quote", margin: [0, 2] },
      { text: user.area, style: "quote", margin: [0, 2] },

      user.bio,
      { image: "userImage", width: 200, height: 150, margin: [0, 10, 0, 0] },
    ],
    images: {
      userImage: await createBase64Img(user.image),
    },
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        color: "#123123",
      },
      subheader: {
        fontSize: 15,
        bold: true,
      },
      quote: {
        italics: true,
      },
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition);
  pdfReadableStream.end();

  return pdfReadableStream;
};

import { NextResponse } from "next/server";
import Client from "../../../../vision";

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { errorMessage: "No image URL provided" },
        { status: 400 }
      );
    }

    // Call the Vision API with specific features for the task.
    const [result] = await Client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: "LOGO_DETECTION" },
        { type: "TEXT_DETECTION" },
        // { type: "IMAGE_PROPERTIES" },
        { type: "LABEL_DETECTION" },
        // { type: "WEB_DETECTION" },
      ],
    });

    // Extract relevant details from the response.
    // const logos =
    //   result.logoAnnotations?.map((logo) => ({
    //     description: logo.description,
    //     score: logo.score,
    //   })) || [];

    // const texts =
    //   result.textAnnotations?.slice(0, 1).map((text) => ({
    //     description: text.description,
    //   })) || [];

    // const webEntities = result.webDetection?.webEntities || [];
    // console.log(JSON.stringify(webEntities),'webEntities')
    // const descriptions = webEntities
    //   .slice(0, 5)
    //   .map((e) => e.description)
    //   .filter(Boolean);
    // const descriptionString = descriptions.join("\n");

    const garmentLabels =
      result.labelAnnotations?.slice(0, 4).map((label) => label.description) ||
      [];

    const texts =
      result.textAnnotations?.slice(0, 1).map((text) => text.description) || [];

    const logos = result.logoAnnotations?.map((logo) => logo.description) || [];

    // Build description string
    let description = garmentLabels.join(", ");

    if (texts.length) {
      description += ` with text "${texts[0]}"`;
    }

    if (logos.length) {
      description += ` by brand ${logos[0]}`;
    }

    // Return the extracted data as JSON.
    return NextResponse.json(
      {
        message: "Image processed successfully",
        logos,
        texts,
        descriptions: description,
        garmentLabels,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error, "error");
    // Return the error message.
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 } // Internal server error status code
    );
  }
}

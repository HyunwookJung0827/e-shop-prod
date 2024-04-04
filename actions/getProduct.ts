import prisma from "@/libs/prismadb";

export interface IProductParams {
  category?: string | null;
  searchTerm?: string | null;
}

export default async function getProducts(params: IProductParams) {
  try {
    const { category, searchTerm } = params;
    let searchString = searchTerm;

    // Do we have a search term?
    if (!searchString) {
      searchString = "";
    }

    let query: any = {};

    // if we have a category we will update our query object
    if (category) {
      query.category = category;
    }

    const products = await prisma.product.findMany({
      where: {
        ...query,
        OR: [
          {
            // We include the logic for the search term here
            name: {
              contains: searchString,
              // insensitive: do not care about small or capital letters
              mode: "insensitive",
            },
            description: {
              contains: searchString,
              // insensitive: do not care about small or capital letters
              mode: "insensitive",
            },
          },
        ],
      },
      // Let us also include the reviews for each product
      include: {
        reviews: {
          include: {
            user: true,
          },
          orderBy: {
            // We want the latest reviews to show first (descending)
            createdDate: "desc",
          },
        },
      },
    });
    // We tried getting the products from the database
    return products;
  } catch (error: any) {
    throw new Error(error);
  }
}

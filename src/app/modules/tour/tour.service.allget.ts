import { excludeField } from "../../constants";
import { QueryBuilder } from "../../utils/queryBuilder";
import { tourSearchableFields } from "./tour.constant";
import { Tour } from "./tour.model";

export const getAllTours = async (query: Record<string, string>) => {
  console.log(query);
  // copy of main query but actual one remain and after removing when call query its provide actual one
  const filter = { ...query };
  // delete filter["searchTerm"]
  // delete filter["sort"]
  for (const field of excludeField) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete filter[field];
  }
  console.log(filter);

  //actual one query it not remove
  const searchTerm = query.searchTerm || "";
  const sort = query.sort || "-createdAt";
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const fields = query.fields?.split(",").join(" ") || "";
  //old field => title,location
  //new fields => title location

  const searchQuery = {
    $or: tourSearchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    })),
  };

  // const tours = await Tour.find(searchQuery).find(filter).sort(sort).select(fields).skip(skip).limit(limit);

  const filterQuery = Tour.find(filter);

  const tours = filterQuery.find(searchQuery);

  const allTours = await tours
    .sort(sort)
    .select(fields)
    .skip(skip)
    .limit(limit);

  // location = Dhaka
  // search = Golf
  const totalTours = await Tour.countDocuments();
  const totalPage = Math.ceil(totalTours / limit);

  const meta = {
    page: page,
    limit: limit,
    total: totalTours,
    totalPage: totalPage,
  };
  return {
    data: allTours,
    meta: meta,
  };
};

//servise
export const getAllToursd = async (query: Record<string, string>) => {
  // The query only runs when you await it or call .exec() on it

  //   When you call Tour.find(), Mongoose creates a Query object.
  // This Query object represents the database query you want to run — like a blueprint or a recipe.
  // But at this point, the query is NOT sent to the database yet.
  // It’s just an object that knows what to do when you finally ask it to run.

  //   const query = Tour.find({ location: "Paris" });  // Query object created but NOT run yet
  // const results = await query;  // Now Mongoose sends the query to MongoDB, and you get results

  //   Step                                           	What happens
  // Tour.find()	                             Creates a Query object (no DB call yet)
  // Adding .sort(), .limit() etc.          	Modifies the Query object (still no DB call)
  // await query or .exec()	              Actually sends the query to MongoDB and fetches results

  // find() creates a Mongoose Query object — this object has all those handy methods like .sort(), .limit(), .select(), .skip(), etc.
  const queryBuilder = new QueryBuilder(Tour.find(), query);

  //   Each method like .search(), .filter(), .sort(), .fields(), .paginate() modifies and builds the Mongoose Query object internally — but does NOT run the query yet.
  // Only when you use await on the final chain, it executes the query against the database and returns the results.
  const tours = await queryBuilder
    .search(tourSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();
  //     After calling all your methods:
  // queryBuilder.filter().search().sort().fields().paginate();
  // Your this.modelQuery becomes:
  // Tour.find().find(filter).find(searchQuery).sort().select().skip().limit()
  // than i need call

  // const meta = await queryBuilder.getMeta()

  const [data, meta] = await Promise.all([
    //     All your methods (search(), filter(), etc.) return this, which is the QueryBuilder instance.
    // So the entire chain returns the same queryBuilder instance.
    // Therefore:
    // tours is actually the same as queryBuilder (the instance).
    // So tours.build() and queryBuilder.build() are exactly the same call.

    tours.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

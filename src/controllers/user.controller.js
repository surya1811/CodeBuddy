const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const users = await User.aggregate([
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "posts",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          posts: { $size: "$posts" },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    const response = {
      data: {
        users,
        pagination: {
          totalDocs: totalUsers,
          limit,
          page,
          totalPages,
          pagingCounter: (page - 1) * limit + 1,
          hasPrevPage,
          hasNextPage,
          prevPage: hasPrevPage ? page - 1 : null,
          nextPage: hasNextPage ? page + 1 : null,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

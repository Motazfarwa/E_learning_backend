const mongoose = require(' mongoose');
const Schema = mongoose.Schema ;

const commentSchema = new Schema ({

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
      },
      content: {
        type: String,
        required: [true, 'Le contenu du commentaire est requis'],
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    });
module.exports = {
    commentModel: mongoose.model('comments', commentSchema),
};

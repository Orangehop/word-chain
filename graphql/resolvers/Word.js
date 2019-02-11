// The User schema.
import Word from "../../models/Word";
import WordChain from "../../models/WordChain";
import User from "../../models/User";
import validateWord from "../../scripts/validateWord";
import { PubSub, withFilter } from 'apollo-server-express';

const pubsub = new PubSub();

const WORD_ADDED = 'WORD_ADDED';


export default {
  Word: {
    wordChain: async (root) => {
      return await WordChain.findById(root.wordChain).populate().exec();
    },
    user: async (root) => {
      return await User.findById(root.user).populate().exec();
    }
  },
  Query: {
    word: async (root, args) => {
      return await Word.findOne(args).populate('WordChain').exec();
    },
    words: async (root, { }) => {
      return await Word.find({}).populate().exec();
    },
  },
  Mutation: {
    addWord: async (root, { id, value, userId }) => {
      value = value.trim().toLowerCase();
      const chain = await WordChain.findById(id).populate('words').exec();
      const user = await User.findById(userId);
      const lastLetter = chain.lastLetter;

      if (lastLetter !== '' && lastLetter !== value[0]) {
        throw new Error("Invalid: The first letter does not match the previous word's last letter");
      }

      const valid = await validateWord(value, chain);
      if (valid === -2) {
        throw new Error("Invalid: Not a real word!");
      }
      else if (valid === -1) {
        throw new Error("Invalid: You broke the rules!")
      }

      chain.lastLetter = value[value.length - 1];
      chain.lastIndex++;
      const word = new Word({
        wordChain: id,
        value: value,
        user: userId,
        sequence: chain.lastIndex
      });
      const savedWord = await word.save();
      await chain.words.push(savedWord._id);
      await user.words.push(savedWord._id);
      await chain.save();
      await user.save();
      console.log(savedWord);
      await pubsub.publish(WORD_ADDED, { wordAdded: savedWord });
      return chain;
    }
  },
  Subscription: {
    wordAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('WORD_ADDED'),
        (payload, variables) => {

          if (payload.wordAdded.wordChain.toString() === variables.wordChainId){
          }
          return payload.wordAdded.wordChain.toString() === variables.wordChainId;
        },
      )
    }
  }
};
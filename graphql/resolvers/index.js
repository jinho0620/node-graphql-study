const Event = require("../../models/event");
const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const Booking = require("../../models/booking");
const event = require("../../models/event");

const user = async (userId) => {
  try {
    const user = await User.findById(userId);
    return {
      ...user._doc,
      createdEvents: events.bind(this, user._doc.createdEvents),
    };
  } catch (err) {
    throw err;
  }
};

const events = async (eventIds) => {
  try {
    const events = await Event.find({ _id: { $in: eventIds } });
    return events.map((event) => {
      return {
        ...event._doc,
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, event.creator),
      };
    });
  } catch (err) {
    throw err;
  }
};

const singleEvent = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    return {
      ...event._doc,
      date: new Date(event._doc.date).toISOString(),
      creator: user.bind(this, event.creator),
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  events: async () => {
    try {
      const events = await Event.find();

      return events.map((event) => {
        return {
          ...event._doc,
          date: new Date(event._doc.date).toISOString(),
          creator: user.bind(this, event._doc.creator),
        };
      });
    } catch (err) {
      throw err;
    }
  },

  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map((booking) => {
        // createdAt and updatedAt will override the field from ...booking._doc

        // the time is manipulated to be readable, otherwise it is returned in miliseconds timestamp.
        return {
          ...booking._doc,
          user: user.bind(this, booking._doc.user),
          event: singleEvent.bind(this, booking._doc.event),
          createdAt: new Date(booking._doc.createdAt).toISOString(),
          updatedAt: new Date(booking._doc.updatedAt).toISOString(),
        };
      });
    } catch (err) {
      throw err;
    }
  },

  createEvent: async (args) => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(),
      creator: "675ee0f356d7497ea496df19",
    });
    let createdEvent;
    try {
      const result = await event.save();
      createdEvent = {
        ...result._doc,
        creator: user.bind(this, result._doc.creator),
      };

      const creator = await User.findById("675ee0f356d7497ea496df19");
      if (!creator) {
        throw new Error("User not found.");
      }
      creator.createdEvents.push(event);
      await creator.save();
      return createdEvent;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  createUser: async (args) => {
    try {
      const userInDB = await User.findOne({ email: args.userInput.email });
      if (userInDB) {
        throw new Error("User exists already.");
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
      const user = new User({
        email: args.userInput.email,
        password: hashedPassword,
      });
      const result = await user.save();
      console.log(result);
      return { ...result._doc, password: null };
    } catch (err) {
      throw err;
    }
  },

  bookEvent: async (args) => {
    const fetchedEvent = await Event.findOne({ _id: args.eventId });
    const booking = new Booking({
      user: "675ee0f356d7497ea496df19",
      event: fetchedEvent,
    });
    const createdBooking = await booking.save();
    return {
      ...createdBooking._doc,
      user: user.bind(this, booking._doc.user),
      event: singleEvent.bind(this, booking._doc.event),
      createdAt: new Date(createdBooking._doc.createdAt).toISOString(),
      updatedAt: new Date(createdBooking._doc.updatedAt).toISOString(),
    };
  },

  cancelBooking: async (args) => {
    try {
      const booking = await Booking.findById(args.bookingId).populate("event");
      const event = {
        ...booking.event._doc,
        _id: booking.event.id, // id (getter) should not be used with _doc. I have to access _id with _doc.
        creator: user.bind(this, booking.event._doc.creator),
      };

      await Booking.deleteOne({ _id: args.bookingId });
      return event;
    } catch (err) {
      throw err;
    }
  },
};

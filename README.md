# RoomForU

RoomForU is a full-stack room rental platform built for students who need to find rooms, PGs, or shared accommodations in other cities. Property owners can create accounts, publish listings with images and pricing details, and manage their properties from a personal profile page.

The project is deployed on Render and uses Node.js, Express, MongoDB, EJS, Passport.js, Cloudinary, and Multer.

## Features

- Local authentication with signup and signin
- Google OAuth login
- Create, edit, and delete room listings
- Upload listing images using Cloudinary
- Store listing coordinates for map-based location data
- Search listings by title, description, and location
- Add and delete reviews with ratings
- User profile page showing posted listings
- Flash messages for common actions and errors

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- EJS with `ejs-mate`
- Passport.js
- Cloudinary
- Multer
- Express Session with `connect-mongo`
- Method Override
- Connect Flash

## Project Structure

```text
StudentRoomHub/
├── app.js
├── cloudConfig.js
├── controller/
├── init/
├── middleware.js
├── models/
├── public/
├── routes/
├── utils/
└── views/
```

## Deployment

This project is deployed on Render.

If you want to publish your own version, configure these environment variables in Render:

```env
MONGO_URI=your_mongodb_connection_string
cloudName=your_cloudinary_cloud_name
apiKey=your_cloudinary_api_key
apiSecret=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Prerequisites

Before running locally, make sure you have:

- Node.js installed
- MongoDB connection string
- Cloudinary account
- Google OAuth credentials for Google login

## Local Installation

1. Clone the repository:

```bash
git clone https://github.com/innovate-with-pratyush002/StudentRoomHub.git
cd StudentRoomHub
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
MONGO_URI=your_mongodb_connection_string
cloudName=your_cloudinary_cloud_name
apiKey=your_cloudinary_api_key
apiSecret=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Start the app:

```bash
node app.js
```

For development:

```bash
npx nodemon app.js
```

5. Open:

```text
http://localhost:3000
```

## Seed Data

Sample listing data is available in [`init/data.js`](./init/data.js).

To seed the database:

```bash
node init/index.js
```

Note: the seed script clears the existing `Listing` collection before inserting sample data.

## Main Routes

- `/signup` - create an account
- `/signin` - sign in with username and password
- `/auth/google` - sign in with Google
- `/logout` - log out the current user
- `/listings` - view all listings
- `/listings/new` - create a new listing
- `/listings/:id` - view listing details after login
- `/listings/:id/edit` - edit a listing if you are the owner
- `/listings/:id/reviews` - add or delete reviews
- `/search?search=<query>` - search listings after login
- `/profile` - view the current user's profile and listings

### Listing

A listing contains:

- title
- description
- image metadata
- price
- location
- state
- room type
- preferred tenant
- availability status
- contact phone number
- owner reference
- reviews
- GeoJSON map coordinates

### Review

A review contains:

- comment
- rating from 1 to 5
- owner reference
- creation timestamp

### UserAuth

A user contains:

- name
- email
- username for local authentication
- optional Google account ID
- optional profile picture

## Contributing

Contributions are welcome. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening an issue or pull request.

## License

This project is licensed under the `MIT` license. See [`LICENSE`](./LICENSE).

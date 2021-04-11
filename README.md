# H&R 2020 - VR Robot Explorer
 **[Our Devpost](https://devpost.com/software/hnr2020-vr-robot)**

This is basically a robot which is controlled by VR. The robot has two cameras and some sensors which are used to give users data about the environment the robot is in. Input from the camera and sensors is displayed on the VR headset. The clients can rotate their headset, which will cause the robot's camera to rotate in the same direction, and by touching the side button of the headset, the robot will start or stop moving.

The project consists of 4 main modules: The client, server, Raspberry Pi and Arduino. All 4 modules communicate with each other either directly or through another module to ensure that the robot functions as expected.

## Module list
 - [Client Module](https://github.com/team-unununium/HnR-2020-VR-Client)
 - [Server Module](https://github.com/team-unununium/HnR-2020-VR-Server)
 - [Raspberry Pi Module](https://github.com/team-unununium/HnR-2020-VR-Pi)
 - [Arduino Module](https://github.com/team-unununium/HnR-2020-VR-Arduino)

# Current module - Server
The server module is in charge of facilitating communication between the client and the Raspberry Pi. It is made using [Node JS](https://nodejs.org/) with [Express](https://www.npmjs.com/package/express) and [Socket.IO](https://www.npmjs.com/package/socket.io). The identities of the client and the robot is identified through the environment variables SERVER_CLIENT_SECRET and SERVER_ROBOT_SECRET respectively. Express is used to generate the token for clients and robots through /access and Socket.IO is used for the actual communication between the server, client and Raspberry Pi. The video feed is done through WebRTC, which is not relayed through the server.

## Existing servers
The main server is currently [unununium.pcchin.com](https://unununium.pcchin.com/).

## How to install
You would need to clone the repository and set the following environment variables:

 - `PORT`: The port that the server would be listening on
 - `MONGODB_URL`: The URL to connect to the MongoDB database.
 - `JWT_SECRET`: The secret used to generate tokens for the clients and robots.
 - `SERVER_CLIENT_SECRET`: The secret used to verify the client, this variable should be present on the client as well.
 - `SERVER_ROBOT_SECRET`: The secret used to verify the robot, this variable should be present on the robot as well.
 - `SERVER_OPERATOR_SECRET`: The secret used to verify the operator, this variable should be present on the client as well.
 - `ADMIN_PW`: The password which allows the admin to login and delete all data located on the database. *Warning: This password is **extremely dangerous** should **never** be leaked under any circumstances.*
 
 After that, just run `npm install --production` then `npm start` and you should be good to go!
 
## Installation notes
- Due to the way the video feeds and data communication works between the server, robot and client, only **one** robot is allowed onto the Socket.IO connection of each server at a time. To set up systems with multiple robots, multiple servers would need to be set up. We have no plans of implementing support for multiple robots in the future.
- The default host for the server is `localhost`. To modify the host, you may need to modify the code for listening located in the last part of `src/app.js`.
- If there is some sort of error with the database, you can wipe all data from it by accessing `/nuke` with the username `admin` and password `ADMIN_PW`. This should only be used as a last resort.

# If you wish to help

## Contributing
Any contribution is welcome, feel free to add any issues or pull requests to the repository.

## Licenses
This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).

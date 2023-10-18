# Interactive Rabbit Simulator 

This is a single page React website made using Create React App. It interacts with a realtime database hosted on Firebase and contains a P5 canvas to render a simplistic representation of a simulated rabbit and its environment. 

This project was originally linked with a number of IoT devices, framed as an interactive museum exhibit. Communication between the website and the IoT devices was done via a realtime database hosted on Firebase. Both the exhibit and the original database are now defunct, but I have created a new realtime database on my own Firebase account to house the generated messages. Note that if the number of requests per day is exceeded then new messages will no longer be generated. I have not mocked up the IoT devices, and instead random values are initally assigned to the environment variables on startup, and are then only changed by user interaction with the webpage. 

I have not been able to resolve Babel issues that would allow me to deploy a production version of the website, so to see it in action either refer to 'CS5041 P4 Demo.mp4' or clone the repository and run the website locally. To run the website locally after cloning, navigate to creative-brief-app/ and run `npm install` followed by `npx expo start --web`. 

To learn more about the motivations and restrictions of the original project please see 'CS5041 P4 Report.pdf'. 

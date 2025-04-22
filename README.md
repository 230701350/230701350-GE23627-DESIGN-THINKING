# DT_CVD (Color Vision Deficiency Helper)

A web-based platform that helps users with different types of color blindness (Protanopia, Deuteranopia, Tritanopia) identify and correct colors from images or webcam input using color simulation and correction algorithms.

## Overview

DT_CVD is designed to support individuals with Color Vision Deficiency (CVD) by providing intuitive tools for identifying pixel-level color information, simulating CVD views, and visualizing corrected images. The app supports user authentication, history tracking, and educational insights for better understanding of CVD types.

## Features

- Color simulation for Protanopia, Deuteranopia, and Tritanopia  
- Pixel inspector to get the name, RGB value, and corrected color of any pixel  
- Real-time webcam support and image upload  
- Color-corrected image generation  
- History tracking for analyzed images and data  
- Educational module for learning about color blindness  
- User authentication including registration, login, and password reset  
- Profile management for viewing and editing user details  
- Responsive and accessible UI using reusable EJS partials  

## Tech Stack

- Backend: Node.js, Express.js  
- Templating Engine: EJS (Embedded JavaScript Templates)  
- Frontend: HTML, CSS, JavaScript  
- Client-Side Processing: Canvas API for image manipulation  
- Authentication: Custom middleware  
- Storage: Local filesystem (extendable to cloud storage)  
- Database: Not currently defined (pluggable)

## Project Structure

```
DT_CVD/
├── app.js
├── middleware.js
├── package.json
├── package-lock.json
├── .gitignore
├── views/
│   ├── home.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── forgot.ejs
│   ├── reset.ejs
│   ├── dashboard.ejs
│   ├── profile.ejs
│   ├── history.ejs
│   ├── educational.ejs
│   ├── image-details.ejs
│   └── partials/
│       ├── header.ejs
│       ├── footer.ejs
│       └── navbar.ejs
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── educational.js
│   ├── history.js
│   └── profile.js
└── public/
    ├── css/
    │   ├── styles.css
    │   └── history.css
    ├── js/
    │   ├── colorAnalysis.js
    │   ├── dashboard-client.js
    │   ├── history-client.js
    │   ├── imageProcessor.js
    │   └── webcam.js
    └── images/
        ├── color.jpg
        ├── ntod.png
        ├── ntop.png
        ├── ntot.png
        └── placeholder-image.png
```

## Installation

1. Clone the repository  
   ```bash
   git clone https://github.com/yourusername/DT_CVD.git
   cd DT_CVD
   ```

2. Install dependencies  
   ```bash
   npm install
   ```

3. Start the server  
   ```bash
   node app.js
   ```

4. Visit in your browser at  
   [http://localhost:3000](http://localhost:3000)

## Usage

1. Register or login to access the dashboard  
2. Upload an image or activate webcam to analyze color content  
3. Select the desired CVD type (Protanopia, Deuteranopia, or Tritanopia)  
4. View simulation or corrected image  
5. Click on any pixel to inspect and compare color values  
6. Review analysis history and read educational resources

## Contributing

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/your-feature`)  
3. Commit your changes (`git commit -m 'Add new feature'`)  
4. Push to the branch (`git push origin feature/your-feature`)  
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Contact

Name: Sudharshan Krishnaa L K  
Email: 230701350@rajalakshmi.edu.in

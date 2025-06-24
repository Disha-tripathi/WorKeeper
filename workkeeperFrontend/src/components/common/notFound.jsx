import React from 'react';
import notfound from "../../images/page404.png";


const NotFoundPage = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px',
    },
    header: {
      fontSize: '48px',
      color: '#333',
    },
    message: {
      fontSize: '18px',
      color: '#666',
      marginBottom: '20px',
    },
    button: {
      padding: '15px 30px',
      backgroundColor: '#000000',
      color: 'white',
      border: 'none',
      fontSize: '18px',
      borderRadius: '5px',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    image: {
      maxWidth: '300px',
      marginBottom: '20px',
    },
    footer: {
      marginTop: '40px',
      fontSize: '14px',
      color: '#333',
    },
    footerLink: {
      textDecoration: 'none',
      color: '#333',
      marginRight: '20px',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        Oops! Page not found.
      </header>

      <div>
        <img
          src={notfound}// Replace with your 404 image
          alt="Page not found"
          style={styles.image}
        />
      </div>

      <p style={styles.message}>
        The page you're looking for might have been moved or doesn't exist.
      </p>

      <a href="/" style={styles.button}>
        Go Back to Home
      </a>

    </div>
  );
};

export default NotFoundPage;

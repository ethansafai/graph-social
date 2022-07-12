const LoadingSpinner = ({ text }) => {
  return (
    <>
      <div className="spinner-container">
        <div className="loading-spinner"></div>
      </div>
      {text && <p className="mt-2 text-center">{text}</p>}
    </>
  );
};

export default LoadingSpinner;

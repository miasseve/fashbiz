const VideoSection = () => {
  return (
    <section className="bg-black h-[618px] flex items-center justify-center">
      <div className="relative w-[70%] max-w-4xl">

        {/* Video */}
        <video
          className="w-full rounded-lg"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>

        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-white text-[36px] font-bold text-center">
            Your REe Video
          </h2>
        </div>

      </div>
    </section>
  );
};

export default VideoSection;

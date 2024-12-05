import React, { useState } from 'react';
import { generateReview } from "@/lib/actions/codeReview";

const Review = ({ getCode }) => {
  const [review, setReview] = useState("");

  const handleGetReview = async () => {
    const code = getCode();
    console.log(code);
    const reviewText = await generateReview(code);
    console.log(reviewText);
    setReview(reviewText);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Review</h2>
      <button onClick={handleGetReview} className="btn">Get Review</button>
      <p>{review}</p>
    </div>
  );
};

export default Review;

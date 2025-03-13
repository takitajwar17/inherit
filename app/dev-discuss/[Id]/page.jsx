"use client";



export default function QuestionDetailPage({ params }) {
  
  const { Id } = params;

  const [questionData, setQuestionData] = useState(null);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(0);
  const [replyContent, setReplyContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchQuestion = async () => {
      const question = await getQuestionById(Id);
      question.replies = question.replies || [];
      setQuestionData(question);
      setVotes(question.votes);
    };

    fetchQuestion();
  }, [Id]);

  const handleUpvote = async () => {
    if (userVote === 1) return;

    try {
      const response = await fetch(`/api/questions/${Id}/upvote`, {
        method: "POST",
      });
      if (response.ok) {
        setVotes((prev) => prev + 1);
        setUserVote(1);
      } else {
        toast.error("Failed to upvote");
      }
    } catch (error) {
      console.error("Error upvoting:", error);
      toast.error("Error upvoting. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
         <h1>Dev dicuss question page id</h1>
        
         

        

        
       
       
        
      </div>
    </main>
  );
}

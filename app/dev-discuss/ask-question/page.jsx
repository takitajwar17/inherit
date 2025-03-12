// app/dev-discuss/ask-question/page.jsx

// "use client";

export default function AskQuestionPage() {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleTagInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || tags.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const question = await createQuestion(
        title,
        description,
        tags,
        userId,
        aiResponseRequested
      ); // Pass aiResponseRequested
      console.log("Question created:", question);
      toast.success("Question posted successfully!");
      router.push("/dev-discuss"); // Redirect to the discussion page
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Error posting question. Please try again.");
    }
  };

  return <main className="min-h-screen bg-background"></main>;
}

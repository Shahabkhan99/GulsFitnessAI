// new update ver 25.2710-02
"use client";
import React, { useState } from "react";
import styles from "@/app/Components/Homepage/Homepage.module.css";
import { ToggleGroup, ToggleGroupItem } from "@/app/Components/ui/toggle-group";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { jsPDF } from "jspdf";
import InstallIcon from "@/app/svg/Install";

const Homepage = () => {
  const [details, setDetails] = useState({
    name: "",
    age: Number(""),
    height: Number(""),
    weight: Number(""),
    neck: Number(""),
    waist: Number(""),
    hips: Number(""),
  });
  const [fitnessGoals, setFitnessGoals] = useState<
    "Loose Weight" | "Gain Weight" | "Toned Muscles"
  >("Loose Weight");
  const [bodyFatPercentage, setbodyFatPercentage] = useState(0);
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [chatTracker, setchatTracker] = useState({
    nameEntered: false,
    ageAndGenderEntered: false,
    bodyFatEntered: false,
    AimEntered: false,
    dietEntered: false,
  });

  // --- NEW STATE FOR LOADING ---
  const [isLoading, setIsLoading] = useState(false);

  const [aiWoResp, setAiWoResp] = useState<React.JSX.Element | string>(() => (
    <div className={styles.skeletonChat}>
      <Skeleton className={styles.skeleton1} />
      <Skeleton className={styles.skeleton2} />
      <Skeleton className={styles.skeleton1} />
      <Skeleton className={styles.skeleton2} />
    </div>
  ));
  const [aiDietResp, setAiDietResp] = useState<React.JSX.Element | string>(
    () => (
      <div className={styles.skeletonChat}>
        <Skeleton className={styles.skeleton1} />
        <Skeleton className={styles.skeleton2} />
        <Skeleton className={styles.skeleton1} />
        <Skeleton className={styles.skeleton2} />
      </div>
    )
  );

  const [dispDiet, setDispdiet] = useState<"Yes" | "No">();
  const [diet, setdiet] = useState<
    "Halal Non-Vegetarian do not include any pork, pig, bacon, ham, or any dishes containing alcohol" | "Vegeterian" | "Eggeterian" | undefined
  >();

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const chatHandler = (
    e: React.MouseEvent<HTMLButtonElement | HTMLInputElement>
  ) => {
    setchatTracker({ ...chatTracker, [e.currentTarget.name]: true });
  };
  const calculateBFP = () => {
    const log10 = Math.log10;
    setbodyFatPercentage(
      gender === "Female"
        ? 163.205 *
            log10(
              Number(details.waist) +
                Number(details.hips) -
                Number(details.neck)
            ) -
            97.684 * log10(Number(details.height)) -
            78.387
        : 86.01 * log10(Number(details.waist) - Number(details.neck)) -
            70.041 * log10(Number(details.height)) +
            36.76
    );
  };

  // -----------------------------------------------------------------
  // --- THIS IS THE UPDATED API FUNCTION (WITH BETTER ERRORS) ---
  // -----------------------------------------------------------------
  const promptSend = async (promptText: string, type: "workout" | "diet") => {
    setIsLoading(true);
    // Clear the previous response and show skeletons
    if (type === "workout") {
      setAiWoResp(
        <div className={styles.skeletonChat}>
          <Skeleton className={styles.skeleton1} />
          <Skeleton className={styles.skeleton2} />
        </div>
      );
    } else {
      setAiDietResp(
        <div className={styles.skeletonChat}>
          <Skeleton className={styles.skeleton1} />
          <Skeleton className={styles.skeleton2} />
        </div>
      );
    }

    try {
      // This now calls YOUR OWN Next.js API route
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      // --- NEW HUGGING FACE ERROR HANDLING (IMPROVED) ---
      if (!response.ok) {
        let errorMsg = "Sorry, I ran into an error. Please try again.";
        const contentType = response.headers.get("content-type");

        if (response.status === 503) {
          errorMsg = "The AI is warming up. Please wait 20 seconds and try again.";
        } else if (response.status === 429) {
          errorMsg = "Sorry, I'm a bit overwhelmed right now. Please try again in a minute.";
        } else if (response.status === 404) {
          errorMsg = "API route not found (404). Did you create the 'app/api/generate/route.ts' file?";
        } else if (contentType && contentType.includes("application/json")) {
          // It's a 500 or 400 with a JSON error from our route
          const errData = await response.json();
          console.error("Error from API route:", errData);
          // This will show the specific error, like "HF_TOKEN environment variable is not set"
          errorMsg = `Server Error: ${errData.error || response.statusText}`;
        } else {
          // It's a 500 error with HTML, or some other unexpected response
          const errText = await response.text();
          console.error("Non-JSON Error from API route:", errText);
          errorMsg = `Server error (${response.status}). Check Vercel logs.`;
        }

        if (type === "workout") setAiWoResp(errorMsg);
        else setAiDietResp(errorMsg);
        
        setIsLoading(false);
        return; // Stop the function here
      }

      const data = await response.json();

      // Success! Get the generated text.
      const aiText = data.generated_text;

      if (type === "workout") {
        setAiWoResp(aiText);
      } else if (type === "diet") {
        setAiDietResp(aiText);
      }
    } catch (error) {
      console.error("Failed to fetch from API route:", error);
      const errorMsg = "Sorry, I ran into an error. Please try again.";
      if (type === "workout") setAiWoResp(errorMsg);
      else setAiDietResp(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  // --- END OF UPDATED API FUNCTION ---

  function parseMarkdownToHtml(text: string): string {
    // Convert **bold** text to <strong>bold</strong>
    text = String(text);
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert * bullet points into <ul><li></li></ul>
    text = text.replace(/\n\* (.*?)\n/g, "<ul><li>$1</li></ul>");

    // Convert line breaks into <br>
    text = text.replace(/\n/g, "<br>");

    return text;
  }
  const parseMarkdownToText = (markdown: string) => {
    markdown = String(markdown);
    return markdown
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold formatting (**text**)
      .replace(/\*(.*?)\*/g, "$1") // Remove italic formatting (*text*)
      .replace(/```([\s\S]*?)```/g, "$1") // Remove code blocks
      .replace(/<\/?[^>]+(>|$)/g, "") // Strip any remaining HTML tags
      .replace(/\n/g, "\n"); // Preserve line breaks
  };

  const generateWoPdf = () => {
    const formattedMarkdown =
      typeof aiWoResp === "string" ? parseMarkdownToText(aiWoResp) : "";
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const margin = 10;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 7;
    let y = margin;
    const textLines = pdf.splitTextToSize(formattedMarkdown, pageWidth);
    textLines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    });
    pdf.save("WorkoutPlan.pdf");
  };
  const generateDietPdf = () => {
    const formattedMarkdown =
      typeof aiDietResp === "string" ? parseMarkdownToText(aiDietResp) : "";
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const margin = 10;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 7;
    let y = margin;
    const textLines = pdf.splitTextToSize(formattedMarkdown, pageWidth);
    textLines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    });
    pdf.save("DietPlan.pdf");
  };

  return (
    <div className="p-10 sm:text-sm sm:p-6">
      <div className="flex flex-col justify-center items-center w-full">
        <h1 className="text-5xl my-7 text-center">
          Welcome to Gul's <span className="bg-muted rounded-xl px-2">Fitness Club</span>!
        </h1>
        <div>One Place For All Your Fitness Needs.</div>
      </div>
      <div className="flex flex-col justify-end items-end w-full h-full mt-14">
        <div className={styles.chat}>Merhaba Dear, What is your good name?</div>
        <div className="flex flex-col justify-end items-end">
          <Input
            autoComplete="off"
            type="text"
            disabled={chatTracker.nameEntered}
            className={styles.inputs}
            placeholder="Enter Your Name"
            name="name"
            value={details.name}
            onChange={changeHandler}
          ></Input>
          <Button
            className={styles.submitbtn}
            variant="secondary"
            name="nameEntered"
            onClick={chatHandler}
          >
            Submit
          </Button>
        </div>

        {chatTracker.nameEntered && (
          <div className="flex flex-col justify-end items-end">
            <div className={styles.chat}>
              Merhaba {details.name}, Let&apos;s get you in the best shape of your life!
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className={styles.chat}>Tell me about yourself</div>
              <Input
                disabled={chatTracker.ageAndGenderEntered}
                className={styles.bfpInput}
                type="number"
                autoComplete="off"
                placeholder="Enter your age"
                name="age"
                onChange={changeHandler}
              ></Input>
              <div className="flex justify-center mr-2">
                <ToggleGroup
                  disabled={chatTracker.ageAndGenderEntered}
                  type="single"
                  variant="outline"
                  className={styles.ToggleGroup}
                >
                  <ToggleGroupItem
                    className={styles.toggleBtn}
                    value={"Male"}
                    onClick={() => setGender("Male")}
                  >
                    Male
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    className={styles.toggleBtn}
                    value={"Female"}
                    onClick={() => setGender("Female")}
                  >
                    Female
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <Button
                variant="secondary"
                className={styles.submitbtn}
                name="ageAndGenderEntered"
                onClick={chatHandler}
              >
                Submit
              </Button>
            </div>
            {chatTracker.ageAndGenderEntered && (
              <div className="flex flex-col justify-end items-end">
                <div className={styles.chat}>
                  Alright, now let&apos;s calculate you body Fat percentage
                </div>
                <div className="flex flex-col justify-end items-end">
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Weight in kg"
                    name="weight"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Height in inches"
                    name="height"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Neck in inches"
                    name="neck"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    autoComplete="off"
                    className={styles.bfpInput}
                    placeholder="Waist in inches"
                    name="waist"
                    onChange={changeHandler}
                  ></Input>
                  {gender === "Female" && (
                    <Input
                      disabled={chatTracker.bodyFatEntered}
                      autoComplete="off"
                      className={styles.bfpInput}
                      type="number"
                      placeholder="Hips in inches"
                      name="hips"
                      onChange={changeHandler}
                    ></Input>
                  )}
                  <Button
                    className={styles.submitbtn}
                    variant="secondary"
                    name="bodyFatEntered"
                    onClick={(e) => {
                      chatHandler(e);
                      calculateBFP();
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
            {chatTracker.bodyFatEntered && (
              <div className="flex flex-col justify-end items-end">
                <div className={styles.chat}>
                  Your body fat percentage is {bodyFatPercentage.toFixed(2)}%
                </div>
                <div className="flex flex-col justify-end items-end">
                  <div className={styles.chat}>
                    What are your fitness goals?
                  </div>
                  <ToggleGroup
                    disabled={chatTracker.AimEntered}
                    type="single"
                    variant="outline"
                    className={styles.ToggleGroup}
                  >
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Loose Weight"
                      onClick={() => {
                        setFitnessGoals("Loose Weight");
                      }}
                    >
                      Loose Weight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Gain Weight"
                      onClick={() => setFitnessGoals("Gain Weight")}
                    >
                      Gain Weight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Toned Muscles"
                      onClick={() => setFitnessGoals("Toned Muscles")}
                    >
                      Toned Body
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button
                    variant="secondary"
                    className={styles.submitbtn}
                    name="AimEntered"
                    disabled={isLoading} // Disable button when loading
                    onClick={(e) => {
                      chatHandler(e);
                      promptSend(
                        `Hi I am a ${details.age} year old ${gender} with ${details.weight} kg weight and ${details.height} inches height and ${bodyFatPercentage}% body Fat percentage I aim to have ${fitnessGoals} create a workout routine/plan for me. Reply very concisely with only the workout plan and absolutely nothing else. The plan should be in clear and in detail. No extra information or text just the workout plan since I want to copy and paste it.`,
                        "workout"
                      );
                    }}
                  >
                    {isLoading && dispDiet !== "Yes" ? "Generating..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}

            {chatTracker.AimEntered &&
              (typeof aiWoResp === "string" ? (
                <div className="flex flex-col justify-end items-end">
                  <div className={styles.chat}>
                    Here is your personalised workout plan
                  </div>
                  <div
                    className={styles.chat}
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdownToHtml(aiWoResp),
                    }}
                  />
                  <div className={styles.chat}>
                    Would you like a specific diet plan as well?
                  </div>
                  <ToggleGroup
                    disabled={chatTracker.dietEntered}
                    type="single"
                    variant="outline"
                    className={styles.ToggleGroup}
                  >
                    <ToggleGroupItem
                      value="Yes"
                      className={styles.toggleBtn}
                      onClick={() => setDispdiet("Yes")}
                    >
                      Yes
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="No"
                      className={styles.toggleBtn}
                      onClick={() => setDispdiet("No")}
                    >
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              ) : (
                <div>{aiWoResp}</div> // This will show the skeleton
              ))}
            {chatTracker.AimEntered && (
              <div className="flex flex-col justify-end items-end"></div>
            )}
            {dispDiet === "Yes" ? (
              <div className="flex flex-col justify-end items-end">
                <div className={styles.chat}>
                  Okay! What are your dietary preferences?
                </div>
                <ToggleGroup
                  disabled={chatTracker.dietEntered}
                  type="single"
                  variant="outline"
                  className={styles.ToggleGroup}
                >
                  <ToggleGroupItem
                    value="Non-Vegetarian"
                    className={styles.toggleBtn}
                    // --- THIS IS THE FIX ---
                    onClick={() => setdiet("Halal Non-Vegetarian do not include any pork, pig, bacon, ham, or any dishes containing alcohol")}
                  >
                    Non-Vegeterian
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Vegeterian"
                    className={styles.toggleBtn}
                    onClick={() => setdiet("Vegeterian")}
                  >
                    Vegeterian
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Eggeterian"
                    className={styles.toggleBtn}
                    onClick={() => setdiet("Eggeterian")}
                  >
                    Eggeterian
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button
                  variant="secondary"
                  className={styles.submitbtn}
                  name="dietEntered"
                  disabled={isLoading} // Disable button when loading
                  onClick={(e) => {
                    chatHandler(e);
                    promptSend(
                      `Hi I am a ${details.age} year old ${gender} with ${details.weight} kg weight and ${details.height} inches height and ${bodyFatPercentage}% body Fat percentage I aim to have ${fitnessGoals} create a weekly diet plan for me I am a ${diet} and do not include any pork, pig, bacon, ham, or any dishes containing alcohol halal food only". Reply very concisely with only the diet plan and absolutely nothing else. The plan should be in clear and in detail. No extra sentences or information just the diet plan`,
                      "diet"
                    );
                  }}
                >
                  {isLoading ? "Generating..." : "Submit"}
                </Button>
              </div>
            ) : dispDiet === "No" ? (
              <div className="flex flex-col justify-end items-end">
                <div className={styles.chat}>
                  You are all done! All the best in your Fitness Journey!
                </div>
                <div className={styles.chat}>
                  You can download the Workout and diet plan from the PDF
                </div>
                <Button variant="outline" onClick={generateWoPdf}>
                  <InstallIcon /> Workout_Plan.pdf
                </Button>
              </div>
            ) : null}
            {chatTracker.dietEntered &&
              (typeof aiDietResp === "string" ? (
                <div className="w-full">
                  <div className="flex flex-col justify-end items-end">
                    <div
                      className={styles.chat}
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdownToHtml(aiDietResp),
                      }}
                    />
                    <div className={styles.chat}>
                      You are all done! All the best in your Fitness Journey!
                    </div>
                    <div className={styles.chat}>
                      You can download the Workout and diet plan from the PDF
                    </div>
                    <div className="flex gap-2 mb-20">
                      <Button variant="outline" onClick={generateDietPdf}>
                        <InstallIcon /> Diet_Plan.pdf
                      </Button>
                      <Button variant="outline" onClick={generateWoPdf}>
                        <InstallIcon /> Workout_Plan.pdf
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {aiDietResp} {/* This will show the skeleton */}
                </div>
              ))}
          </div>
        )}
      </div>
      {typeof aiDietResp === "string" && (
        <div className="flex flex-col justify-center items-center w-full">
          <div className="text-5xl my-7">Thank You!</div>
          <div>Created By Gul's Fantasy.</div>
        </div>
      )}
    </div>
  );
};

export default Homepage;

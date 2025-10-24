"use client";
import React, { useState } from "react";
import styles from "@/app/Components/Homepage/Homepage.module.css";
import { ToggleGroup, ToggleGroupItem } from "@/app/Components/ui/toggle-group";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { jsPDF } from "jspdf";
import InstallIcon from "@/app/svg/Install";
import ReactMarkdown from "react-markdown"; // Added for safe markdown rendering

// 1. Define an interface for your details state
interface UserDetails {
  name: string;
  age: string;
  height: string;
  weight: string;
  neck: string;
  waist: string;
  hips: string;
}

const Homepage = () => {
  // 2. Initialize all form fields as strings
  const [details, setDetails] = useState<UserDetails>({
    name: "",
    age: "",
    height: "",
    weight: "",
    neck: "",
    waist: "",
    hips: "",
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
    "Non-Vegeterian" | "Vegeterian" | "Eggeterian"
  >();

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const chatHandler = (
    e: React.MouseEvent<HTMLButtonElement | HTMLInputElement>
  ) => {
    setchatTracker({ ...chatTracker, [e.currentTarget.name]: true });
  };

  // 3. Made BFP calculation safer
  const calculateBFP = () => {
    const log10 = Math.log10;

    // Convert and validate inputs
    const height = Number(details.height);
    const waist = Number(details.waist);
    const neck = Number(details.neck);

    // Basic validation to prevent division by zero or log(0)
    if (height <= 0 || waist <= 0 || neck <= 0) {
      setbodyFatPercentage(0); // Set to 0 or show an error
      return;
    }

    let bfp;
    if (gender === "Female") {
      const hips = Number(details.hips);
      if (hips <= 0) {
        setbodyFatPercentage(0);
        return;
      }
      bfp =
        163.205 * log10(waist + hips - neck) -
        97.684 * log10(height) -
        78.387;
    } else {
      bfp =
        86.01 * log10(waist - neck) - 70.041 * log10(height) + 36.76;
    }

    // Final check for NaN or Infinity
    if (!isFinite(bfp) || isNaN(bfp)) {
      setbodyFatPercentage(0);
    } else {
      setbodyFatPercentage(bfp);
    }
  };

  // 4. Added robust error handling to API calls
  const promptSend = async (promptText: string, type: "workout" | "diet") => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const resultText = data.text || "Sorry, I received an empty response.";

      if (type === "workout") {
        setAiWoResp(resultText);
      } else if (type === "diet") {
        setAiDietResp(resultText);
      }
    } catch (error) {
      console.error("Failed to send prompt:", error);
      const errorMsg = "Sorry, something went wrong. Please try again later.";

      // Show an error message to the user
      if (type === "workout") {
        setAiWoResp(errorMsg);
      } else if (type === "diet") {
        setAiDietResp(errorMsg);
      }
    }
  };

  // Kept this function for PDF generation
  const parseMarkdownToText = (markdown: string) => {
    markdown = String(markdown);
    return markdown
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold formatting (**text**)
      .replace(/\*(.*?)\*/g, "$1") // Remove italic formatting (*text*)
      .replace(/```([\s\S]*?)```/g, "$1") // Remove code blocks
      .replace(/<\/?[^>]+(>|$)/g, "") // Strip any remaining HTML tags
      .replace(/\n/g, "\n"); // Preserve line breaks
  };

  // 5. Created a single, reusable PDF generator
  const generatePdf = (content: string, fileName: string) => {
    const formattedMarkdown =
      typeof content === "string" ? parseMarkdownToText(content) : "";

    // Add a check in case the content isn't a string yet (e.g., still skeleton)
    if (!formattedMarkdown || typeof content !== "string") {
      alert("The plan is not ready to be downloaded yet.");
      return;
    }

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

    pdf.save(fileName);
  };

  return (
    <div className="p-10 sm:text-sm sm:p-6">
      <div className="flex flex-col justify-center items-center w-full">
        <h1 className="text-5xl my-7 text-center">
          Welcome to Gul's Fitness Club<span className="bg-muted rounded-xl px-2">Ai</span>!
        </h1>
        <div>One Place For All Your Fitness Needs.</div>
      </div>
      <div className="flex flex-col justify-end items-end w-full h-full mt-14">
        <div className={styles.chat}>Hello, What is your name?</div>
        <div className="flex flex-col justify-end items-end">
          <Input
            autoComplete="off"
            type="text"
            disabled={chatTracker.nameEntered}
            className={styles.inputs}
            placeholder="Enter Your Name"
            aria-label="Enter Your Name" // 8. Added aria-label
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
              Hi {details.name}, Lets get you in the best shape of your life!
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className={styles.chat}>Tell me about yourself</div>
              <Input
                disabled={chatTracker.ageAndGenderEntered}
                className={styles.bfpInput}
                type="number"
                autoComplete="off"
                placeholder="Enter your age"
                aria-label="Enter your age" // 8. Added aria-label
                name="age"
                onChange={changeHandler}
              ></Input>
              <div className="flex justify-center mr-2">
                {/* 7. Used onValueChange for ToggleGroup */}
                <ToggleGroup
                  disabled={chatTracker.ageAndGenderEntered}
                  type="single"
                  variant="outline"
                  className={styles.ToggleGroup}
                  onValueChange={(value: "Male" | "Female" | "") => {
                    if (value) setGender(value);
                  }}
                >
                  <ToggleGroupItem
                    className={styles.toggleBtn}
                    value={"Male"}
                  >
                    Male
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    className={styles.toggleBtn}
                    value={"Female"}
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
                  Alright, now lets calculate you body Fat percentage
                </div>
                <div className="flex flex-col justify-end items-end">
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Weight in kg"
                    aria-label="Weight in kg" // 8. Added aria-label
                    name="weight"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Height in inches"
                    aria-label="Height in inches" // 8. Added aria-label
                    name="height"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    autoComplete="off"
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    className={styles.bfpInput}
                    placeholder="Neck in inches"
                    aria-label="Neck in inches" // 8. Added aria-label
                    name="neck"
                    onChange={changeHandler}
                  ></Input>
                  <Input
                    disabled={chatTracker.bodyFatEntered}
                    type="number"
                    autoComplete="off"
                    className={styles.bfpInput}
                    placeholder="Waist in inches"
                    aria-label="Waist in inches" // 8. Added aria-label
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
                      aria-label="Hips in inches" // 8. Added aria-label
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
                  {/* 7. Used onValueChange for ToggleGroup */}
                  <ToggleGroup
                    disabled={chatTracker.AimEntered}
                    type="single"
                    variant="outline"
                    className={styles.ToggleGroup}
                    onValueChange={(
                      value: "Loose Weight" | "Gain Weight" | "Toned Muscles"
                    ) => {
                      if (value) setFitnessGoals(value);
                    }}
                  >
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Loose Weight"
                    >
                      Loose Weight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Gain Weight"
                    >
                      Gain Weight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className={styles.toggleBtn}
                      value="Toned Muscles"
                    >
                      Toned Muscles
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button
                    variant="secondary"
                    className={styles.submitbtn}
                    name="AimEntered"
                    onClick={(e) => {
                      chatHandler(e);
                      promptSend(
                        `Hi I am a ${details.age} year old ${gender} with ${details.weight} kg weight and ${details.height} inches height and ${bodyFatPercentage}% body Fat percentage I aim to have ${fitnessGoals} create a workout routine/plan for me. Reply very concisely with only the workout plan and absolutely nothing else. The plan should be in clear and in detail. No extra information or text just the workout plan since I want to copy and paste it.`,
                        "workout"
                      );
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {chatTracker.AimEntered &&
              (typeof aiWoResp === "string" ? (
                <div className="flex flex-col justify-end items-end">
                  <div className={styles.chat}>
                    Here is a your personalised workout plan
                  </div>
                  {/* 6. Used ReactMarkdown for safe rendering */}
                  <div className={styles.chat}>
                    <ReactMarkdown>{aiWoResp}</ReactMarkdown>
                  </div>
                  <div className={styles.chat}>
                    Would you like a specific diet plan as well?
                  </div>
                  {/* 7. Used onValueChange for ToggleGroup */}
                  <ToggleGroup
                    disabled={chatTracker.dietEntered}
                    type="single"
                    variant="outline"
                    className={styles.ToggleGroup}
                    onValueChange={(value: "Yes" | "No") => {
                      if (value) setDispdiet(value);
                    }}
                  >
                    <ToggleGroupItem value="Yes" className={styles.toggleBtn}>
                      Yes
                    </ToggleGroupItem>
                    <ToggleGroupItem value="No" className={styles.toggleBtn}>
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              ) : (
                <div>{aiWoResp}</div>
              ))}
            {chatTracker.AimEntered && (
              <div className="flex flex-col justify-end items-end"></div>
            )}
            {dispDiet === "Yes" ? (
              <div className="flex flex-col justify-end items-end">
                <div className={styles.chat}>
                  Okay! What are your dietary prefrences.
                </div>
                {/* 7. Used onValueChange for ToggleGroup */}
                <ToggleGroup
                  disabled={chatTracker.dietEntered}
                  type="single"
                  variant="outline"
                  className={styles.ToggleGroup}
                  onValueChange={(
                    value: "Non-Vegeterian" | "Vegeterian" | "Eggeterian"
                  ) => {
                    if (value) setdiet(value);
                  }}
                >
                  <ToggleGroupItem
                    value="Non-Vegeterian"
                    className={styles.toggleBtn}
                  >
                    Non-Vegeterian
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Vegeterian"
                    className={styles.toggleBtn}
                  >
                    Vegeterian
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Eggeterian"
                    className={styles.toggleBtn}
                  >
                    Eggeterian
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button
                  variant="secondary"
                  className={styles.submitbtn}
                  name="dietEntered"
                  onClick={(e) => {
                    chatHandler(e);
                    promptSend(
                      `Hi I am a ${details.age} year old ${gender} with ${details.weight} kg weight and ${details.height} inches height and ${bodyFatPercentage}% body Fat percentage I aim to have ${fitnessGoals} create a weekly diet plan for me I am a ${diet}. Reply very concisely with only the diet plan and absolutely nothing else. The plan should be in clear and in detail. No extra sentences or information just the diet plan`,
                      "diet"
                    );
                  }}
                >
                  Submit
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
                {/* 5. Using new reusable PDF function */}
                <Button
                  variant="outline"
                  onClick={() => generatePdf(aiWoResp, "WorkoutPlan.pdf")}
                >
                  <InstallIcon /> Workout_Plan.pdf
                </Button>
              </div>
            ) : null}
            {chatTracker.dietEntered &&
              (typeof aiDietResp === "string" ? (
                <div className="w-full">
                  <div className="flex flex-col justify-end items-end">
                    {/* 6. Used ReactMarkdown for safe rendering */}
                    <div className={styles.chat}>
                      <ReactMarkdown>{aiDietResp}</ReactMarkdown>
                    </div>
                    <div className={styles.chat}>
                      You are all done! All the best in your Fitness Journey!
                    </div>
                    <div className={styles.chat}>
                      You can download the Workout and diet plan from the PDF
                    </div>
                    <div className="flex gap-2 mb-20">
                      {/* 5. Using new reusable PDF function */}
                      <Button
                        variant="outline"
                        onClick={() =>
                          generatePdf(aiDietResp, "DietPlan.pdf")
                        }
                      >
                        <InstallIcon /> Diet_Plan.pdf
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          generatePdf(aiWoResp, "WorkoutPlan.pdf")
                        }
                      >
                        <InstallIcon /> Workout_Plan.pdf
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>{aiDietResp}</div>
              ))}
          </div>
        )}
      </div>
      {typeof aiDietResp === "string" && (
        <div className="flex flex-col justify-center items-center w-full">
          <div className="text-5xl my-7">Thank You!</div>
          <div>Created By Rahil.</div>
        </div>
      )}
    </div>
  );
};

export default Homepage;

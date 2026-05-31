"use client";
import { useState } from "react";
export function AssessmentSection() {
  const [expanded, setExpanded] = useState(false);
  const [hasComputer, setHasComputer] = useState("");
  const [courseUnderstanding, setCourseUnderstanding] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [canPost, setCanPost] = useState("");
  const [canBrowser, setCanBrowser] = useState("");
  const [hasEmail, setHasEmail] = useState("");
  const [canLogin, setCanLogin] = useState("");
  const [hasDevice, setHasDevice] = useState("");
  const [hasInternet, setHasInternet] = useState("");
  function toggleMulti(
    arr: string[],
    setArr: (v: string[]) => void,
    val: string,
  ) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }
  const radioClass = "flex items-center gap-2 text-sm cursor-pointer";
  const checkboxClass = radioClass;
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <p className="font-medium text-gray-900">
            Student Assessment (Optional)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quick questionnaire to understand student background
          </p>
        </div>
        <span className="text-muted-foreground text-lg">
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div className="p-6 space-y-8">
          <input
            type="hidden"
            name="assessment_hasComputer"
            value={hasComputer}
          />
          <input
            type="hidden"
            name="assessment_courseUnderstanding"
            value={courseUnderstanding.join(",")}
          />
          <input
            type="hidden"
            name="assessment_platforms"
            value={platforms.join(",")}
          />
          <input type="hidden" name="assessment_canPost" value={canPost} />
          <input
            type="hidden"
            name="assessment_canBrowser"
            value={canBrowser}
          />
          <input type="hidden" name="assessment_hasEmail" value={hasEmail} />
          <input type="hidden" name="assessment_canLogin" value={canLogin} />
          <input type="hidden" name="assessment_hasDevice" value={hasDevice} />
          <input
            type="hidden"
            name="assessment_hasInternet"
            value={hasInternet}
          />
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 border-b pb-2">
              1. General Understanding
            </h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                A. Do you have basic computer knowledge?
              </p>
              <div className="flex gap-4">
                {["YES", "NO"].map((v) => (
                  <label key={v} className={radioClass}>
                    <input
                      type="radio"
                      name="ui_hasComputer"
                      checked={hasComputer === v}
                      onChange={() => setHasComputer(v)}
                      className="accent-blue-600"
                    />
                    {v === "YES" ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                B. Understanding of the selected course
              </p>
              <div className="flex flex-col gap-2">
                {[
                  "I know it well",
                  "I have no idea",
                  "I don't know it at all",
                ].map((v) => (
                  <label key={v} className={checkboxClass}>
                    <input
                      type="checkbox"
                      checked={courseUnderstanding.includes(v)}
                      onChange={() =>
                        toggleMulti(
                          courseUnderstanding,
                          setCourseUnderstanding,
                          v,
                        )
                      }
                      className="accent-blue-600"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 border-b pb-2">
              2. Social Media Skills
            </h3>
            <div className="flex flex-wrap gap-4">
              {["Facebook", "Instagram", "TikTok", "None"].map((v) => (
                <label key={v} className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={platforms.includes(v)}
                    onChange={() => toggleMulti(platforms, setPlatforms, v)}
                    className="accent-blue-600"
                  />
                  {v}
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              {[
                ["YES", "Yes"],
                ["WITH_HELP", "With help"],
                ["NO", "No"],
              ].map(([v, l]) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_canPost"
                    checked={canPost === v}
                    onChange={() => setCanPost(v)}
                    className="accent-blue-600"
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 border-b pb-2">
              3. Basic Digital Skills
            </h3>
            <p className="text-sm font-medium text-gray-700">
              Can use browser?
            </p>
            <div className="flex gap-4">
              {[
                ["YES", "Yes"],
                ["A_LITTLE", "A little"],
                ["NO", "No"],
              ].map(([v, l]) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_canBrowser"
                    checked={canBrowser === v}
                    onChange={() => setCanBrowser(v)}
                    className="accent-blue-600"
                  />
                  {l}
                </label>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-700">
              Has active email?
            </p>
            <div className="flex gap-4">
              {["YES", "NO"].map((v) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_hasEmail"
                    checked={hasEmail === v}
                    onChange={() => setHasEmail(v)}
                    className="accent-blue-600"
                  />
                  {v === "YES" ? "Yes" : "No"}
                </label>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-700">
              Can login to email?
            </p>
            <div className="flex gap-4">
              {["YES", "NO"].map((v) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_canLogin"
                    checked={canLogin === v}
                    onChange={() => setCanLogin(v)}
                    className="accent-blue-600"
                  />
                  {v === "YES" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 border-b pb-2">
              4. Device & Internet Readiness
            </h3>
            <p className="text-sm font-medium text-gray-700">
              Has daily device?
            </p>
            <div className="flex gap-4">
              {["YES", "NO"].map((v) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_hasDevice"
                    checked={hasDevice === v}
                    onChange={() => setHasDevice(v)}
                    className="accent-blue-600"
                  />
                  {v === "YES" ? "Yes" : "No"}
                </label>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-700">
              Stable internet?
            </p>
            <div className="flex gap-4">
              {["YES", "NO"].map((v) => (
                <label key={v} className={radioClass}>
                  <input
                    type="radio"
                    name="ui_hasInternet"
                    checked={hasInternet === v}
                    onChange={() => setHasInternet(v)}
                    className="accent-blue-600"
                  />
                  {v === "YES" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

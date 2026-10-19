---
name: spike
description: "A time-boxed throwaway experiment that answers one question, such as can we do X, is approach A viable, or try it and tell me what you learn. Nothing from it is merged."
---

# Spike

review: own-read

The output is an answer, not code. The spike code is thrown away.

1. State the question and the time box
   Done: one question, a stop condition (a time or step limit from the user, else a small default you state) and what would count as an answer are written down.
2. Build the throwaway with **prototype**
   Done: code that answers the question exists on a scratch branch or in a temp directory, never in the working branch, and the time box was respected.
3. Write the summary
   Done: a question to answer summary (what was tried, what happened with the evidence, what is still unknown, a recommendation) is saved to `$(ven-profile path)/specs/spike-<slug>.md`. Apply **unslop**.
4. Discard
   Done: the scratch branch or directory is deleted, or its path is named in the summary; nothing is merged, and no source file in the working branch changed.
5. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the question, the answer with its evidence, the summary path, and the next playbook if the answer says to build.

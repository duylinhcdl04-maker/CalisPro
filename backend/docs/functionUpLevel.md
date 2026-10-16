FUNCTION evaluateLevel(user, periodicAssessment):

    performance
        = getMeasuredPerformance(periodicAssessment)

    quality
        = getMovementQuality(periodicAssessment)

    reliability
        = evaluateAssessmentReliability(periodicAssessment)

    IF reliability.status == RETEST_REQUIRED:

        saveLevelEvaluation(
            decision = RETEST_REQUIRED
        )

        RETURN getCurrentLevel(user)


    competencies
        = calculateCompetencies(
              performance,
              quality,
              reliability
          )

    skillProgress
        = evaluateSkills(
              user,
              competencies
          )

    currentLevel
        = getCurrentLevel(user)

    candidateLevel
        = determineCandidateLevel(
              competencies,
              performance,
              skillProgress
          )

    performanceGate
        = evaluatePerformanceGate(
              candidateLevel,
              performance
          )

    qualityGate
        = evaluateQualityGate(
              candidateLevel,
              quality
          )

    competencyGate
        = evaluateCompetencyGate(
              candidateLevel,
              competencies
          )

    skillGate
        = evaluateSkillGate(
              candidateLevel,
              skillProgress
          )

    stabilityGate
        = evaluateStability(
              user,
              candidateLevel
          )

    reliabilityGate
        = evaluateReliabilityGate(
              reliability
          )


    IF candidateLevel > currentLevel:

        IF performanceGate == PASS
           AND qualityGate == PASS
           AND competencyGate == PASS
           AND skillGate == PASS
           AND stabilityGate == PASS
           AND reliabilityGate == PASS:

            newLevel = candidateLevel
            decision = PROMOTED

        ELSE:

            newLevel = currentLevel
            decision = MAINTAINED


    ELSE:

        newLevel = currentLevel
        decision = MAINTAINED


    IF regressionCriteriaSatisfied(
           user,
           performance,
           quality,
           competencies
       ):

        newLevel = lowerLevel(currentLevel)
        decision = REGRESSED


    saveLevelEvaluation(
        user,
        periodicAssessment,
        currentLevel,
        candidateLevel,
        newLevel,
        competencies,
        performanceGate,
        qualityGate,
        competencyGate,
        skillGate,
        stabilityGate,
        reliabilityGate,
        decision
    )

    RETURN newLevel
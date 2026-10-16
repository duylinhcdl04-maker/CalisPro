package com.calishealth.api.repository;

import com.calishealth.api.entity.QuestionCompetencyMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface QuestionCompetencyMappingRepository extends JpaRepository<QuestionCompetencyMapping, Long> {
    @Query("select m from QuestionCompetencyMapping m left join fetch m.exercise join fetch m.question where m.question.id in :questionIds")
    List<QuestionCompetencyMapping> findByQuestionIds(Collection<Long> questionIds);
    List<QuestionCompetencyMapping> findByQuestionId(Long questionId);
}

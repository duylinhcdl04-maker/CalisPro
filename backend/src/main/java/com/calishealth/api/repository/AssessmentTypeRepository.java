package com.calishealth.api.repository;
import com.calishealth.api.entity.AssessmentType; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface AssessmentTypeRepository extends JpaRepository<AssessmentType,Long>{Optional<AssessmentType> findByCode(String code);}

package com.calishealth.api.repository;

import com.calishealth.api.entity.LevelRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface LevelRequirementRepository extends JpaRepository<LevelRequirement, Long> {
    @Query("select r from LevelRequirement r join fetch r.level left join fetch r.exercise where r.level.id in :levelIds")
    List<LevelRequirement> findWithRefsByLevelIds(Collection<Long> levelIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from LevelRequirement r where r.level.id in :levelIds")
    void deleteByLevelIds(Collection<Long> levelIds);
}

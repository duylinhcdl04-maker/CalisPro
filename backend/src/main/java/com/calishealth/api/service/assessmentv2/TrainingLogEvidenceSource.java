package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.level.TrainingStabilityEvaluator.Obs;
import com.calishealth.api.service.level.TrainingLogService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Lấy buổi tập từ nhật ký tập luyện hiện có (TrainingLogService: số rep/giây tốt nhất và điểm form của từng bài trong buổi hoàn thành). */
@Component
public class TrainingLogEvidenceSource implements TrainingEvidenceSource {
    private final TrainingLogService logs;
    private final JdbcTemplate jdbc;

    public TrainingLogEvidenceSource(TrainingLogService logs, JdbcTemplate jdbc) { this.logs = logs; this.jdbc = jdbc; }

    @Override
    public List<Obs> observations(long userId, int windowDays) {
        Map<Long, String> codeById = new HashMap<>();
        jdbc.query("SELECT id, code FROM exercises", rch -> { codeById.put(rch.getLong(1), rch.getString(2)); });
        return logs.observations(userId, windowDays).stream()
                .filter(o -> codeById.containsKey(o.exerciseId()))
                .map(o -> new Obs(codeById.get(o.exerciseId()), o.at(), o.bestValue(), o.formScore()))
                .toList();
    }
}

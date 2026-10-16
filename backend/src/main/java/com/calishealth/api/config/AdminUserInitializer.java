package com.calishealth.api.config;

import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class AdminUserInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExerciseCategoryRepository categoryRepository;
    private final ExerciseRepository exerciseRepository;
    private final GoalRepository goalRepository;
    private final AssessmentTypeRepository assessmentTypeRepository;

    public AdminUserInitializer(
            UserRepository userRepository,
            UserProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            ExerciseCategoryRepository categoryRepository,
            ExerciseRepository exerciseRepository,
            GoalRepository goalRepository,
            AssessmentTypeRepository assessmentTypeRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.exerciseRepository = exerciseRepository;
        this.goalRepository = goalRepository;
        this.assessmentTypeRepository = assessmentTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        initAdmin();
        initCategories();
        initExercises();
        initGoals();
        initAssessmentTypes();
    }

    private void initAdmin() {
        String adminEmail = "duylinhpro04@gmail.com";
        String adminPassword = "DuyLinhFZ@1123";

        User admin = userRepository.findByEmail(adminEmail).orElseGet(User::new);
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerified(true);
        User savedAdmin = userRepository.save(admin);

        UserProfile profile = profileRepository.findByUserId(savedAdmin.getId()).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUser(savedAdmin);
            return p;
        });
        profile.setFirstName("Linh");
        profile.setLastName("Duy");
        profileRepository.save(profile);

        log.info("Admin account initialized successfully: {}", adminEmail);
    }

    private void initCategories() {
        if (categoryRepository.count() == 0) {
            createCat("PUSH", "Push", "Horizontal and vertical pushing movements.");
            createCat("PULL", "Pull", "Pulling and rowing movements.");
            createCat("LEGS", "Legs", "Lower body strength movements.");
            createCat("CORE", "Core", "Trunk stability and core movements.");
            createCat("MOBILITY", "Mobility", "Mobility and range-of-motion work.");
            createCat("SKILL", "Skill", "Calisthenics skill development.");
            createCat("CARDIO", "Cardio", "Conditioning and cardiovascular work.");
            log.info("Initialized exercise categories.");
        }
    }

    private void createCat(String code, String name, String desc) {
        ExerciseCategory c = new ExerciseCategory();
        c.setCode(code);
        c.setName(name);
        c.setDescription(desc);
        categoryRepository.save(c);
    }

    private void initExercises() {
        if (exerciseRepository.count() == 0) {
            ExerciseCategory push = categoryRepository.findByCode("PUSH").orElse(null);
            ExerciseCategory pull = categoryRepository.findByCode("PULL").orElse(null);
            ExerciseCategory legs = categoryRepository.findByCode("LEGS").orElse(null);
            ExerciseCategory core = categoryRepository.findByCode("CORE").orElse(null);
            ExerciseCategory skill = categoryRepository.findByCode("SKILL").orElse(null);

            if (push != null) {
                createEx(push, "knee-push-up", "Knee Push Up", "Biến thể chống đẩy trên gối giúp làm chủ tư thế.", "Beginner", "PUSH", false, "https://picsum.photos/seed/calis-knee-push-up/480/360");
                createEx(push, "push-up", "Push Up", "Bài tập nền tảng cho sức mạnh thân trên.", "Beginner", "PUSH", false, "https://picsum.photos/seed/calis-push-up/480/360");
                createEx(push, "diamond-push-up", "Diamond Push Up", "Đặt hai tay tạo hình thoi dưới ngực để tăng tải cho cơ tay sau.", "Intermediate", "PUSH", false, "https://picsum.photos/seed/calis-diamond-push-up/480/360");
                createEx(push, "archer-push-up", "Archer Push Up", "Dồn trọng lượng sang một bên, bước đệm trước One-arm Push Up.", "Advanced", "PUSH", false, "https://picsum.photos/seed/calis-archer-push-up/480/360");
                createEx(push, "dips", "Dips", "Đẩy xà kép phát triển toàn diện ngực dưới và tay sau.", "Intermediate", "PUSH", true, "https://picsum.photos/seed/calis-dips/480/360");
                createEx(push, "pike-push-up", "Pike Push Up", "Chống đẩy hình chữ V ngược xây dựng sức mạnh vai cho Handstand.", "Intermediate", "PUSH", false, "https://picsum.photos/seed/calis-pike/480/360");
                createEx(push, "handstand-push-up", "Handstand Push Up", "Đỉnh cao sức mạnh đẩy vai và thăng bằng chuối.", "Advanced", "PUSH", false, "https://picsum.photos/seed/calis-hspu/480/360");
            }

            if (pull != null) {
                createEx(pull, "dead-hang", "Dead Hang", "Treo người trên xà để xây dựng lực nắm và độ dẻo vai.", "Beginner", "PULL", true, "https://picsum.photos/seed/calis-dead-hang/480/360");
                createEx(pull, "australian-pull-up", "Australian Pull Up", "Hít xà nghiêng ngang ngực cho người mới.", "Beginner", "PULL", true, "https://picsum.photos/seed/calis-australian/480/360");
                createEx(pull, "pull-up", "Pull Up", "Bài kéo nền tảng quan trọng nhất Calisthenics.", "Intermediate", "PULL", true, "https://picsum.photos/seed/calis-pull-up/480/360");
                createEx(pull, "chin-up", "Chin Up", "Hít xà lòng bàn tay hướng vào trong kích hoạt bắp tay trước.", "Intermediate", "PULL", true, "https://picsum.photos/seed/calis-chin-up/480/360");
                createEx(pull, "muscle-up", "Muscle Up", "Kết hợp nhuần nhuyễn giữa kéo nổ và đẩy xà đơn.", "Advanced", "PULL", true, "https://picsum.photos/seed/calis-muscle-up/480/360");
            }

            if (legs != null) {
                createEx(legs, "bodyweight-squat", "Bodyweight Squat", "Ngồi xổm bodyweight xây dựng sức mạnh đùi và mông.", "Beginner", "SQUAT", false, "https://picsum.photos/seed/calis-squat/480/360");
                createEx(legs, "lunges", "Walking Lunges", "Bước chùng chân rèn luyện thăng bằng và đơn chân.", "Beginner", "LUNGE", false, "https://picsum.photos/seed/calis-lunges/480/360");
                createEx(legs, "pistol-squat", "Pistol Squat", "Squat 1 chân đòi hỏi sức mạnh, độ dẻo cổ chân và thăng bằng tuyệt đối.", "Advanced", "SQUAT", false, "https://picsum.photos/seed/calis-pistol/480/360");
            }

            if (core != null) {
                createEx(core, "plank", "Plank", "Giữ tư thế tấm ván ổn định cột sống và cơ lõi.", "Beginner", "HOLD", false, "https://picsum.photos/seed/calis-plank/480/360");
                createEx(core, "hollow-body-hold", "Hollow Body Hold", "Nền tảng giữ phẳng lưng dưới cho mọi skill tĩnh.", "Beginner", "HOLD", false, "https://picsum.photos/seed/calis-hollow/480/360");
                createEx(core, "hanging-leg-raise", "Hanging Leg Raise", "Treo xà gập bụng nhấc chân thẳng chạm xà.", "Intermediate", "CORE", true, "https://picsum.photos/seed/calis-leg-raise/480/360");
                createEx(core, "l-sit", "L-Sit", "Ngồi chữ L trên xà kép hoặc sàn đất.", "Intermediate", "HOLD", false, "https://picsum.photos/seed/calis-lsit/480/360");
                createEx(core, "dragon-flag", "Dragon Flag", "Đòn cờ rồng Bruce Lee kích hoạt toàn bộ chuỗi cơ thân trước.", "Advanced", "CORE", false, "https://picsum.photos/seed/calis-dragon/480/360");
            }

            if (skill != null) {
                createEx(skill, "handstand", "Handstand (Trồng chuối)", "Thăng bằng bằng hai tay toàn thân thẳng tắp.", "Intermediate", "HOLD", false, "https://picsum.photos/seed/calis-handstand/480/360");
                createEx(skill, "planche", "Planche", "Tư thế giữ thân người song song mặt đất chỉ bằng hai bàn tay.", "Advanced", "HOLD", false, "https://picsum.photos/seed/calis-planche/480/360");
                createEx(skill, "front-lever", "Front Lever", "Treo người nằm ngang song song mặt đất.", "Advanced", "HOLD", true, "https://picsum.photos/seed/calis-frontlever/480/360");
            }

            log.info("Initialized 20+ Calisthenics exercises.");
        }
    }

    private void createEx(ExerciseCategory cat, String code, String name, String desc, String diff, String pattern, boolean eq, String thumb) {
        Exercise e = new Exercise();
        e.setCategory(cat);
        e.setCode(code);
        e.setName(name);
        e.setDescription(desc);
        e.setDifficultyLevel(diff);
        e.setMovementPattern(pattern);
        e.setEquipmentRequired(eq);
        e.setThumbnailUrl(thumb);
        e.setActive(true);
        exerciseRepository.save(e);
    }

    private void initGoals() {
        if (goalRepository.count() == 0) {
            Goal g1 = new Goal(); g1.setCode("MUSCLE_UP"); g1.setName("Chinh phục Muscle Up"); g1.setCategory("SKILL"); g1.setDescription("Mục tiêu thực hiện thành công bài tập Muscle Up trên xà đơn."); goalRepository.save(g1);
            Goal g2 = new Goal(); g2.setCode("HANDSTAND"); g2.setName("Làm chủ Handstand"); g2.setCategory("SKILL"); g2.setDescription("Thăng bằng đứng trên hai tay tối thiểu 30 giây."); goalRepository.save(g2);
            Goal g3 = new Goal(); g3.setCode("PLANCHE"); g3.setName("Chinh phục Planche"); g3.setCategory("SKILL"); g3.setDescription("Giữ tư thế Planche thẳng chân tối thiểu 5 giây."); goalRepository.save(g3);
            Goal g4 = new Goal(); g4.setCode("LOSE_FAT"); g4.setName("Giảm mỡ & Săn chắc"); g4.setCategory("FITNESS"); g4.setDescription("Tăng cường trao đổi chất và giảm tỷ lệ mỡ cơ thể."); goalRepository.save(g4);
            Goal g5 = new Goal(); g5.setCode("BUILD_STRENGTH"); g5.setName("Tăng cường sức mạnh"); g5.setCategory("STRENGTH"); g5.setDescription("Tăng số rep hít xà, chống đẩy và sức mạnh nền tảng."); goalRepository.save(g5);
            log.info("Initialized default goals.");
        }
    }

    private void initAssessmentTypes() {
        if (assessmentTypeRepository.count() == 0) {
            AssessmentType t1 = new AssessmentType();
            t1.setCode("INITIAL_ONBOARDING");
            t1.setName("Khảo sát thể lực đầu vào");
            t1.setDescription("Đánh giá toàn diện thể lực, mục tiêu và thói quen ban đầu.");
            assessmentTypeRepository.save(t1);
            log.info("Initialized assessment types.");
        }
    }
}


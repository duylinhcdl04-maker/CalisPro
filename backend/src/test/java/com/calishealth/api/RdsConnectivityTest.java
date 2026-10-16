package com.calishealth.api;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Kiểm tra kết nối tới DB thật (AWS RDS) — CHỈ ĐỌC.
 * Chỉ chạy khi RDS_IT=true và đã đặt DB_URL / DB_USERNAME / DB_PASSWORD:
 *   - Khởi động toàn bộ context => Hibernate ddl-auto=validate đối chiếu mọi entity với schema có sẵn.
 *   - Seeder tắt, kết nối read-only => nếu có câu lệnh ghi nào chạy, MySQL từ chối và test thất bại.
 */
@EnabledIfEnvironmentVariable(named = "RDS_IT", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "app.seed.enabled=false",
        "spring.flyway.enabled=false",
        "spring.sql.init.mode=never",
        "spring.datasource.hikari.read-only=true"
})
class RdsConnectivityTest {

    @Autowired
    DataSource dataSource;

    @Test
    void connectsReadOnlyAndSchemaIsPresent() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            assertTrue(c.isValid(5));
            assertTrue(c.isReadOnly(), "Kết nối kiểm thử phải là read-only");
            try (ResultSet rs = st.executeQuery("SELECT DATABASE(), VERSION()")) {
                assertTrue(rs.next());
                System.out.println("Connected to schema " + rs.getString(1) + " on MySQL " + rs.getString(2));
            }
            try (ResultSet rs = st.executeQuery(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'")) {
                assertTrue(rs.next());
                int tables = rs.getInt(1);
                System.out.println("Base tables: " + tables);
                assertTrue(tables > 0, "Schema rỗng — sai database?");
            }
        }
    }
}

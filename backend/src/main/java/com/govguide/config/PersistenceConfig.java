package com.govguide.config;

import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;

@Configuration
@EnableTransactionManagement
public class PersistenceConfig {
    @Bean
    @Profile("db")
    PlatformTransactionManager dataSourceTransactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean
    @Profile("!db")
    PlatformTransactionManager noOpTransactionManager() {
        return new AbstractPlatformTransactionManager() {
            @Override
            protected Object doGetTransaction() { return new Object(); }

            @Override
            protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) { }

            @Override
            protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) { }

            @Override
            protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) { }
        };
    }
}

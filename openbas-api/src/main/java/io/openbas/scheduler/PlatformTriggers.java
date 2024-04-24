package io.openbas.scheduler;

import lombok.RequiredArgsConstructor;
import org.quartz.Trigger;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import static org.quartz.CronScheduleBuilder.cronSchedule;
import static org.quartz.SimpleScheduleBuilder.repeatMinutelyForever;
import static org.quartz.TriggerBuilder.newTrigger;

@Component
@RequiredArgsConstructor
public class PlatformTriggers {

    private final PlatformJobDefinitions platformJobs;

    @Bean
    public Trigger injectsExecutionTrigger() {
        return newTrigger()
                .forJob(this.platformJobs.getInjectsExecution())
                .withIdentity("InjectsExecutionTrigger")
                .withSchedule(cronSchedule("0 0/1 * * * ?")) // Every minute align on clock
                .build();
    }

    @Bean
    public Trigger comchecksExecutionTrigger() {
        return newTrigger()
                .forJob(this.platformJobs.getComchecksExecution())
                .withIdentity("ComchecksExecutionTrigger")
                .withSchedule(repeatMinutelyForever())
                .build();
    }

    @Bean
    public Trigger scenarioExecutionTrigger() {
        return newTrigger()
            .forJob(this.platformJobs.getScenarioExecution())
            .withIdentity("ScenarioExecutionTrigger")
            .withSchedule(repeatMinutelyForever())
            .build();
    }

    @Bean
    public Trigger telemetryExecutionTrigger() {
        return newTrigger()
            .forJob(this.platformJobs.getTelemetryExecutionTrigger())
            .withIdentity("TelemetryExecutionTrigger")
            .withSchedule(cronSchedule("0 0/1 * * * ?")) // Every 1 hours
            .build();
    }
}

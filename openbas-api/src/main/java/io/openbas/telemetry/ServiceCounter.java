package io.openbas.telemetry;

import com.sun.management.OperatingSystemMXBean;
import io.openbas.config.SessionManager;
import io.openbas.database.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;

@Service
@RequiredArgsConstructor
public class ServiceCounter {

  private final SessionManager sessionManager;

  private final ExerciseRepository exerciseRepository;

  // -- SECURITY --

  public long getActiveSessions() {
    return this.sessionManager.getUserSessionsCount();
  }

  // -- SYSTEM --

  public double getMemoryUsage() {
    MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
    return (double) memoryMXBean.getHeapMemoryUsage().getUsed() / 1073741824;
  }

  public double getCpuUsage() {
    OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);
    return osBean.getProcessCpuLoad();
  }

  // -- SIMULATION --

  public long getSimulationPlayed() {
    return this.exerciseRepository.count();
  }

}

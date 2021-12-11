package io.openex.player.model.execution;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Execution {
    private ExecutionStatus status;
    private final long startTime;
    private List<String> message = new ArrayList<>();

    public Execution() {
        this.status = ExecutionStatus.SUCCESS;
        this.startTime = new Date().getTime();
    }

    public void addMessage(String mess) {
        message.add(mess);
    }

    public Integer getExecution() {
        return (int) (new Date().getTime() - this.startTime);
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public List<String> getMessage() {
        return message;
    }

    public void setMessage(List<String> message) {
        this.message = message;
    }
}

package io.openbas.injects.opencti.service;

import io.openbas.database.model.DataAttachment;
import io.openbas.database.model.Execution;
import io.openbas.injects.opencti.config.OpenCTIConfig;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.*;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

import static io.openbas.database.model.ExecutionTrace.traceError;
import static io.openbas.database.model.ExecutionTrace.traceSuccess;

@Component
public class OpenCTIService {
    private OpenCTIConfig config;

    @Autowired
    public void setConfig(OpenCTIConfig config) {
        this.config = config;
    }

    public void createCase(Execution execution, String name, String description, List<DataAttachment> attachments) throws Exception {
        HttpClient httpclient = HttpClients.createDefault();
        // Prepare the query
        HttpPost httpPost = new HttpPost(config.getUrl() + "/graphql");
        httpPost.addHeader("Authorization", "Bearer " + config.getToken());
        httpPost.addHeader("Content-Type","application/json; charset=utf-8");
        httpPost.addHeader("Accept", "application/json");
        // TODO support attachement
        // if( attachments.size() > 0 ) {
        //    DataAttachment attachment = attachments.get(0);
        // }
        String caseBody = String.format("{\"query\": \"mutation { caseIncidentAdd(input: { name: \\\"%s\\\", description: \\\"%s\\\" }) { id } }\"}", name, description);
        StringEntity httpBody = new StringEntity(caseBody);
        httpPost.setEntity(httpBody);
        httpclient.execute(httpPost, classicHttpResponse -> {
            if (classicHttpResponse.getCode() == HttpStatus.SC_OK) {
                String body = EntityUtils.toString(classicHttpResponse.getEntity());
                execution.addTrace(traceSuccess("opencti_case", "Case created (" + body + ")"));
                return true;
            } else {
                execution.addTrace(traceError("opencti_case", "Fail to POST"));
                return false;
            }
        });
    }

    public void createReport(Execution execution, String name, String description, List<DataAttachment> attachments) throws Exception {
        HttpClient httpclient = HttpClients.createDefault();
        // Prepare the query
        HttpPost httpPost = new HttpPost(config.getUrl() + "/graphql");
        httpPost.addHeader("Authorization", "Bearer " + config.getToken());
        httpPost.addHeader("Content-Type","application/json; charset=utf-8");
        httpPost.addHeader("Accept", "application/json");
        // TODO support attachement
        // if( attachments.size() > 0 ) {
        //    DataAttachment attachment = attachments.get(0);
        // }
        String caseBody = String.format("{\"query\": \"mutation { reportAdd(input: { name: \\\"%s\\\", description: \\\"%s\\\", published: \\\"%s\\\" }) { id } }\"}", name, description, Instant.now().toString());
        StringEntity httpBody = new StringEntity(caseBody);
        httpPost.setEntity(httpBody);
        httpclient.execute(httpPost, classicHttpResponse -> {
            if (classicHttpResponse.getCode() == HttpStatus.SC_OK) {
                String body = EntityUtils.toString(classicHttpResponse.getEntity());
                execution.addTrace(traceSuccess("opencti_report", "Report created (" + body + ")"));
                return true;
            } else {
                execution.addTrace(traceError("opencti_report", "Fail to POST"));
                return false;
            }
        });
    }
}

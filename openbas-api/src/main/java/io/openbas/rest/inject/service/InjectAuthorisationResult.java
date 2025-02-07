package io.openbas.rest.inject.service;

import io.openbas.database.model.Inject;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class InjectAuthorisationResult {
    private List<Inject> authorised = new ArrayList<>();
    private List<Inject> unauthorised = new ArrayList<>();

    public void addAuthorised(Inject inject) {
        authorised.add(inject);
    }

    public void addUnauthorised(Inject inject) {
        unauthorised.add(inject);
    }
}

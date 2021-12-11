package io.openex.helper;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import io.openex.database.model.Base;

import java.io.IOException;
import java.util.List;

public class MultiModelDeserializer extends StdSerializer<List<Base>> {

    public MultiModelDeserializer() {
        this(null);
    }

    public MultiModelDeserializer(Class<List<Base>> t) {
        super(t);
    }

    @Override
    public void serialize(List<Base> base, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
        List<String> ids = base.stream().map(Base::getId).toList();
        String[] arrayIds = ids.toArray(new String[0]);
        jsonGenerator.writeArray(arrayIds, 0, arrayIds.length);
    }
}
